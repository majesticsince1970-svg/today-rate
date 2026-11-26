import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import PosterUploadPanel from './components/PosterUploadPanel';
import OrnamentManager from './components/OrnamentManager';
import ThemeAndBrandPanel from './components/ThemeAndBrandPanel';
import LivePreviewStudio from './components/LivePreviewStudio';
import ExportCenter from './components/ExportCenter';
import RateHistoryPanel from './components/RateHistoryPanel';
import SettingsDrawer from './components/SettingsDrawer';

import {
  COLOR_THEMES,
  DEFAULT_BRAND_LOGO_URL,
  DEFAULT_RATE_DATA,
  SAMPLE_ORNAMENTS,
  VIDEO_FORMATS,
} from './constants/themes';
import { getAppConfig, saveAppConfig } from './services/configStore';
import { isGeminiConfigured } from './services/geminiService';
import { generateStudioStagedOrnament } from './services/geminiStudioStaging';
import {
  cacheStagedOrnamentImage,
  deleteDailyRate,
  deleteOrnament,
  fetchBrandAssets,
  fetchDailyRates,
  fetchOrnaments,
  getCachedStagedUrl,
  isSupabaseConfigured,
  removeBackgroundAudio,
  saveDailyRate,
  uploadBackgroundAudio,
  uploadBrandLogo,
  uploadOrnamentFile,
} from './services/supabaseService';
import { pickDailyOrnament } from './utils/formatters';
import { loadImageForCanvas } from './utils/imageProcessing';
import {
  exportAnimatedVideo,
  exportStaticPoster,
  exportVideosBatch,
  triggerFileDownload,
} from './engine/videoExporter';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [config, setConfig] = useState(() => getAppConfig());
  const [activeTheme, setActiveTheme] = useState(COLOR_THEMES[0]); // Emerald Green (#0E3B2C) default
  const [rateData, setRateData] = useState(DEFAULT_RATE_DATA);

  const [ornaments, setOrnaments] = useState(SAMPLE_ORNAMENTS);
  const [selectedOrnament, setSelectedOrnament] = useState(SAMPLE_ORNAMENTS[0]);
  const [stagedStudioUrl, setStagedStudioUrl] = useState('');
  const [stagingStudio, setStagingStudio] = useState(false);
  const [autoStageOnSelect, setAutoStageOnSelect] = useState(true);

  const [autoPickRandom, setAutoPickRandom] = useState(() => getAppConfig().autoPickRandom);
  const [shuffleSalt, setShuffleSalt] = useState(0);
  const [uploadingOrnaments, setUploadingOrnaments] = useState(false);

  const [brandAssets, setBrandAssets] = useState({
    logoUrl: DEFAULT_BRAND_LOGO_URL,
    audioUrl: '',
    audioName: '',
  });
  const [uploadingBrand, setUploadingBrand] = useState(false);

  const [rateHistory, setRateHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  // Loaded HTMLImageElements for crisp HTML5 Canvas rendering (zero client-side flood-fill cutouts!)
  const [loadedRawOrnament, setLoadedRawOrnament] = useState(null);
  const [loadedStagedOrnament, setLoadedStagedOrnament] = useState(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState(null);

  // Export state (1 Luxury Static Poster + 3 Cinematic 10-Second Videos)
  const [posterFormat, setPosterFormat] = useState('png');
  const [generatedAssets, setGeneratedAssets] = useState({
    poster: null,
    reel: null,
    feed: null,
    landscape: null,
  });
  const [generating, setGenerating] = useState(false);
  const [activeGeneratingIds, setActiveGeneratingIds] = useState([]);
  const [progressMap, setProgressMap] = useState({
    poster: 0,
    reel: 0,
    feed: 0,
    landscape: 0,
  });

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const stagingRequestIdRef = useRef(0);

  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4600);
  }, []);

  const supabaseConnected = useMemo(() => isSupabaseConfigured(), [config]);
  const geminiConnected = useMemo(() => isGeminiConfigured(), [config]);

  const loadWorkspaceData = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [ornRes, brandRes, historyRes] = await Promise.all([
        fetchOrnaments(),
        fetchBrandAssets(),
        fetchDailyRates(),
      ]);
      setOrnaments(ornRes.items);
      setBrandAssets(brandRes);
      setRateHistory(historyRes);

      if (ornRes.items.length > 0) {
        setSelectedOrnament((prev) => {
          if (autoPickRandom) {
            return pickDailyOrnament(ornRes.items, rateData.date, shuffleSalt) || ornRes.items[0];
          }
          const stillExists = ornRes.items.find((o) => o.id === prev?.id);
          return stillExists || ornRes.items[0];
        });
      }
    } catch (err) {
      notify(err.message || 'Could not sync with Supabase.', 'error');
    } finally {
      setLoadingHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  useEffect(() => {
    if (!autoPickRandom || ornaments.length === 0) return;
    const picked = pickDailyOrnament(ornaments, rateData.date, shuffleSalt);
    if (picked) {
      setSelectedOrnament(picked);
    }
  }, [autoPickRandom, ornaments, rateData.date, shuffleSalt]);

  // Run Gemini AI Studio Product Photography Staging & Cache into Supabase Storage (ornament_gallery.staged_url)
  const runStudioStaging = useCallback(
    async (ornament, theme, { forceRegenerate = false } = {}) => {
      if (!ornament) return;

      // 1. Check cached staged_url first unless user explicitly requested Regenerate
      if (!forceRegenerate) {
        const cached = getCachedStagedUrl(ornament, theme.id);
        if (cached) {
          setStagedStudioUrl(cached);
          return;
        }
      }

      if (!isGeminiConfigured()) {
        if (forceRegenerate) {
          notify('Add your VITE_GEMINI_API_KEY in Settings to generate AI Studio backdrops.', 'warning');
          setSettingsOpen(true);
        }
        return;
      }

      const reqId = ++stagingRequestIdRef.current;
      setStagingStudio(true);

      try {
        const result = await generateStudioStagedOrnament(ornament, theme);
        if (reqId !== stagingRequestIdRef.current) return;

        // Immediately display staged photograph on Canvas while caching to Supabase
        setStagedStudioUrl(result.dataUrl);

        const persistedUrl = await cacheStagedOrnamentImage(
          ornament,
          result.blob,
          result.dataUrl,
          theme.id
        );

        if (reqId !== stagingRequestIdRef.current) return;
        setStagedStudioUrl(persistedUrl);

        // Update ornament record in state so cached staged_url is reused instantly for Poster & all 3 Videos
        setOrnaments((prev) =>
          prev.map((o) =>
            o.id === ornament.id
              ? { ...o, staged_url: persistedUrl, staged_theme_id: theme.id }
              : o
          )
        );
        setSelectedOrnament((prev) =>
          prev && prev.id === ornament.id
            ? { ...prev, staged_url: persistedUrl, staged_theme_id: theme.id }
            : prev
        );

        notify(
          `Staged "${ornament.name}" on ${result.standDescription} & cached for instant Poster + 3-Video export!`,
          'success'
        );
      } catch (err) {
        if (reqId === stagingRequestIdRef.current) {
          notify(err.message || 'AI Studio staging failed.', 'error');
        }
      } finally {
        if (reqId === stagingRequestIdRef.current) {
          setStagingStudio(false);
        }
      }
    },
    [notify]
  );

  // Sync cached staged URL when selected ornament or theme changes
  useEffect(() => {
    if (!selectedOrnament) {
      setStagedStudioUrl('');
      return;
    }
    const cached = getCachedStagedUrl(selectedOrnament, activeTheme.id);
    setStagedStudioUrl(cached || '');
  }, [selectedOrnament?.id, activeTheme.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load raw ornament image
  useEffect(() => {
    let cancelled = false;
    const url = selectedOrnament?.image_url || '';
    if (!url) {
      setLoadedRawOrnament(null);
      return undefined;
    }
    loadImageForCanvas(url)
      .then((img) => {
        if (!cancelled) setLoadedRawOrnament(img);
      })
      .catch(() => {
        if (!cancelled) setLoadedRawOrnament(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOrnament?.image_url]);

  // Load cached/generated AI Studio-staged photograph
  useEffect(() => {
    let cancelled = false;
    if (!stagedStudioUrl) {
      setLoadedStagedOrnament(null);
      return undefined;
    }
    loadImageForCanvas(stagedStudioUrl)
      .then((img) => {
        if (!cancelled) setLoadedStagedOrnament(img);
      })
      .catch(() => {
        if (!cancelled) setLoadedStagedOrnament(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stagedStudioUrl]);

  // Load permanent Majestic Jewellers Logo PNG
  useEffect(() => {
    let cancelled = false;
    if (!brandAssets.logoUrl) {
      setLoadedLogoImg(null);
      return undefined;
    }
    loadImageForCanvas(brandAssets.logoUrl)
      .then((img) => {
        if (!cancelled) setLoadedLogoImg(img);
      })
      .catch(() => {
        if (!cancelled) setLoadedLogoImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [brandAssets.logoUrl]);

  // Shared cached studio image feeds BOTH the Static Poster AND all 3 Videos with zero re-API calls
  const isAiStaged = Boolean(loadedStagedOrnament);
  const activeOrnamentImage = isAiStaged ? loadedStagedOrnament : loadedRawOrnament;

  // Theme switch handler: enforce 100% color match by loading cached studio image for the new theme
  // or auto-staging the ornament onto the new theme's matching velvet color!
  const handleSelectTheme = (nextTheme) => {
    setActiveTheme(nextTheme);
    if (!selectedOrnament) return;
    const cached = getCachedStagedUrl(selectedOrnament, nextTheme.id);
    if (cached) {
      setStagedStudioUrl(cached);
    } else {
      setStagedStudioUrl('');
      if (autoStageOnSelect && !selectedOrnament.isSample && geminiConnected) {
        runStudioStaging(selectedOrnament, nextTheme, { forceRegenerate: false });
      }
    }
  };

  // Selecting an ornament from the Ornament Folder
  const handleSelectOrnament = (item, switchToStudioToast = false) => {
    setSelectedOrnament(item);
    const cached = getCachedStagedUrl(item, activeTheme.id);
    if (cached) {
      setStagedStudioUrl(cached);
      if (switchToStudioToast) {
        notify(`Loaded cached studio backdrop for "${item.name}".`, 'success');
      }
      return;
    }

    setStagedStudioUrl('');
    // Auto-stage real uploaded ornaments when Auto-Stage is ON and Gemini key is configured
    if (autoStageOnSelect && !item.isSample && geminiConnected) {
      runStudioStaging(item, activeTheme, { forceRegenerate: false });
    } else if (switchToStudioToast) {
      notify(`Selected "${item.name}". Click "Generate Studio Backdrop" to stage on velvet.`, 'info');
    }
  };

  // Handlers: Ornaments Bulk Upload
  const handleBulkUploadOrnaments = async (files, category) => {
    setUploadingOrnaments(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const item = await uploadOrnamentFile(file, { category });
        uploaded.push(item);
      }
      const { items } = await fetchOrnaments();
      setOrnaments(items);
      if (uploaded[0]) {
        setSelectedOrnament(uploaded[0]);
        setStagedStudioUrl('');
        notify(
          `Uploaded ${uploaded.length} ornament${uploaded.length > 1 ? 's' : ''} to ${
            supabaseConnected ? 'Supabase Storage' : 'Local Folder'
          }!`,
          'success'
        );
        if (autoStageOnSelect && geminiConnected) {
          runStudioStaging(uploaded[0], activeTheme, { forceRegenerate: false });
        }
      }
    } catch (err) {
      notify(err.message || 'Ornament upload failed.', 'error');
    } finally {
      setUploadingOrnaments(false);
    }
  };

  const handleDeleteOrnament = async (ornament) => {
    try {
      await deleteOrnament(ornament);
      const { items } = await fetchOrnaments();
      setOrnaments(items);
      if (selectedOrnament?.id === ornament.id) {
        setSelectedOrnament(items[0] || null);
        setStagedStudioUrl('');
      }
      notify(`Deleted "${ornament.name}".`, 'info');
    } catch (err) {
      notify(err.message || 'Delete failed.', 'error');
    }
  };

  const handleToggleAutoPick = (enabled) => {
    setAutoPickRandom(enabled);
    saveAppConfig({ autoPickRandom: enabled });
    if (enabled) notify('Auto-Pick Daily Random Ornament enabled.', 'info');
  };

  const handleShuffleNow = () => {
    if (ornaments.length <= 1) return;
    const nextSalt = shuffleSalt + 1;
    setShuffleSalt(nextSalt);
    const picked = pickDailyOrnament(ornaments, rateData.date, nextSalt);
    if (picked) {
      handleSelectOrnament(picked, true);
    }
  };

  // Handlers: Brand Logo & Audio Jingle
  const handleUploadLogo = async (file) => {
    setUploadingBrand(true);
    try {
      const logoUrl = await uploadBrandLogo(file);
      setBrandAssets((prev) => ({ ...prev, logoUrl }));
      notify('Majestic Jewellers logo updated!', 'success');
    } catch (err) {
      notify(err.message || 'Logo upload failed.', 'error');
    } finally {
      setUploadingBrand(false);
    }
  };

  const handleUploadAudio = async (file) => {
    setUploadingBrand(true);
    try {
      const { audioUrl, audioName } = await uploadBackgroundAudio(file);
      setBrandAssets((prev) => ({ ...prev, audioUrl, audioName }));
      notify(`Jingle "${audioName}" attached to all 3 cinematic videos!`, 'success');
    } catch (err) {
      notify(err.message || 'Audio upload failed.', 'error');
    } finally {
      setUploadingBrand(false);
    }
  };

  const handleRemoveAudio = async () => {
    await removeBackgroundAudio();
    setBrandAssets((prev) => ({ ...prev, audioUrl: '', audioName: '' }));
    notify('Background audio jingle removed.', 'info');
  };

  // Handlers: Daily Rate History
  const handleSaveRate = async () => {
    setSavingRate(true);
    try {
      await saveDailyRate(rateData);
      const updated = await fetchDailyRates();
      setRateHistory(updated);
      notify(
        `Saved ${rateData.date} rates to ${supabaseConnected ? 'Supabase' : 'Local History'}!`,
        'success'
      );
    } catch (err) {
      notify(err.message || 'Could not save rate.', 'error');
    } finally {
      setSavingRate(false);
    }
  };

  const handleLoadRateFromHistory = (row) => {
    setRateData({
      date: row.rate_date,
      rate_22k_1g: Number(row.rate_22k_1g),
      rate_22k_8g: Number(row.rate_22k_8g),
      rate_18k_1g: Number(row.rate_18k_1g),
      rate_9k_1g: Number(row.rate_9k_1g),
      change_1g: Number(row.change_1g),
      trend: row.trend || 'UNCHANGED',
      customMalayalamText: '',
    });
    setActiveTab('studio');
    notify(`Loaded ${row.rate_date} into the Daily Studio.`, 'info');
  };

  const handleDeleteRateHistory = async (id) => {
    try {
      await deleteDailyRate(id);
      setRateHistory((prev) => prev.filter((r) => r.id !== id));
      notify('Deleted rate history entry.', 'info');
    } catch (err) {
      notify(err.message || 'Could not delete rate.', 'error');
    }
  };

  // Handlers: Module D — 1 Luxury Static Poster + 3 Simultaneous 10-Second Cinematic Videos
  const revokeOldUrl = (asset) => {
    if (asset?.url && asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }
  };

  const renderPosterNow = async () => {
    setActiveGeneratingIds(['poster']);
    setProgressMap((p) => ({ ...p, poster: 45 }));
    const poster = await exportStaticPoster({
      theme: activeTheme,
      rateData,
      ornamentImage: activeOrnamentImage,
      logoImage: loadedLogoImg,
      isAiStaged,
      format: posterFormat,
    });
    setGeneratedAssets((prev) => {
      revokeOldUrl(prev.poster);
      return { ...prev, poster };
    });
    setProgressMap((p) => ({ ...p, poster: 100 }));
    return poster;
  };

  const handleGenerateAllAssets = async () => {
    if (generating) return;
    setGenerating(true);
    setProgressMap({ poster: 0, reel: 0, feed: 0, landscape: 0 });
    try {
      await renderPosterNow();

      const videoIds = VIDEO_FORMATS.map((f) => f.id);
      setActiveGeneratingIds(videoIds);

      try {
        const batchResults = await exportVideosBatch({
          formatSpecs: VIDEO_FORMATS,
          theme: activeTheme,
          rateData,
          ornamentImage: activeOrnamentImage,
          logoImage: loadedLogoImg,
          isAiStaged,
          fps: config.exportFps || 30,
          audioUrl: brandAssets.audioUrl,
          onProgress: (id, pct) => {
            setProgressMap((prev) => ({ ...prev, [id]: pct }));
          },
        });

        setGeneratedAssets((prev) => {
          for (const id of videoIds) revokeOldUrl(prev[id]);
          return { ...prev, ...batchResults };
        });
      } catch {
        for (const fmt of VIDEO_FORMATS) {
          setActiveGeneratingIds([fmt.id]);
          const vid = await exportAnimatedVideo({
            formatSpec: fmt,
            theme: activeTheme,
            rateData,
            ornamentImage: activeOrnamentImage,
            logoImage: loadedLogoImg,
            isAiStaged,
            fps: config.exportFps || 30,
            audioUrl: brandAssets.audioUrl,
            onProgress: (pct) => setProgressMap((p) => ({ ...p, [fmt.id]: pct })),
          });
          setGeneratedAssets((prev) => {
            revokeOldUrl(prev[fmt.id]);
            return { ...prev, [fmt.id]: vid };
          });
        }
      }

      notify(
        'All 4 assets (1 Luxury Static Poster + 3 Cinematic 10s Videos) are ready!',
        'success'
      );
    } catch (err) {
      notify(err.message || 'Asset rendering failed.', 'error');
    } finally {
      setActiveGeneratingIds([]);
      setGenerating(false);
    }
  };

  const handleGenerateSingleAsset = async (assetId) => {
    if (generating) return;
    setGenerating(true);
    try {
      if (assetId === 'poster') {
        await renderPosterNow();
      } else {
        const fmtSpec = VIDEO_FORMATS.find((f) => f.id === assetId);
        if (fmtSpec) {
          setActiveGeneratingIds([assetId]);
          const vid = await exportAnimatedVideo({
            formatSpec: fmtSpec,
            theme: activeTheme,
            rateData,
            ornamentImage: activeOrnamentImage,
            logoImage: loadedLogoImg,
            isAiStaged,
            fps: config.exportFps || 30,
            audioUrl: brandAssets.audioUrl,
            onProgress: (pct) => setProgressMap((p) => ({ ...p, [assetId]: pct })),
          });
          setGeneratedAssets((prev) => {
            revokeOldUrl(prev[assetId]);
            return { ...prev, [assetId]: vid };
          });
        }
      }
      notify('Asset rendered successfully!', 'success');
    } catch (err) {
      notify(err.message || 'Render failed.', 'error');
    } finally {
      setActiveGeneratingIds([]);
      setGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    const list = [
      generatedAssets.poster,
      generatedAssets.reel,
      generatedAssets.feed,
      generatedAssets.landscape,
    ].filter(Boolean);

    list.forEach((asset, index) => {
      setTimeout(() => {
        triggerFileDownload(asset.url, asset.filename);
      }, index * 320);
    });
    notify(`Downloading ${list.length} assets...`, 'success');
  };

  const generatedCount = Object.values(generatedAssets).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#090A0D] pb-24 text-stone-100 md:pb-10">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        supabaseConnected={supabaseConnected}
        geminiConnected={geminiConnected}
        onOpenSettings={() => setSettingsOpen(true)}
        ornamentCount={ornaments.length}
        generatedCount={generatedCount}
      />

      <main className="mx-auto max-w-[1640px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        {activeTab === 'studio' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-5 xl:col-span-5">
                <PosterUploadPanel
                  rateData={rateData}
                  setRateData={setRateData}
                  onSaveRate={handleSaveRate}
                  savingRate={savingRate}
                  geminiConnected={geminiConnected}
                  onOpenSettings={() => setSettingsOpen(true)}
                  notify={notify}
                />

                <ThemeAndBrandPanel
                  activeTheme={activeTheme}
                  setActiveTheme={handleSelectTheme}
                  brandAssets={brandAssets}
                  onUploadLogo={handleUploadLogo}
                  onUploadAudio={handleUploadAudio}
                  onRemoveAudio={handleRemoveAudio}
                  uploadingBrand={uploadingBrand}
                />

                <OrnamentManager
                  ornaments={ornaments}
                  selectedOrnament={selectedOrnament}
                  onSelectOrnament={(item) => handleSelectOrnament(item, false)}
                  onBulkUpload={handleBulkUploadOrnaments}
                  onDeleteOrnament={handleDeleteOrnament}
                  uploadingOrnaments={uploadingOrnaments}
                  autoPickRandom={autoPickRandom}
                  onToggleAutoPick={handleToggleAutoPick}
                  onShuffleNow={handleShuffleNow}
                  activeTheme={activeTheme}
                  stagedStudioUrl={stagedStudioUrl}
                  stagingStudio={stagingStudio}
                  autoStageOnSelect={autoStageOnSelect}
                  onToggleAutoStage={setAutoStageOnSelect}
                  onGenerateStudioBackdrop={() =>
                    runStudioStaging(selectedOrnament, activeTheme, { forceRegenerate: true })
                  }
                  onResetToOriginal={() => setStagedStudioUrl('')}
                  compact
                />
              </div>

              <div className="space-y-5 xl:col-span-7">
                <div className="space-y-5 xl:sticky xl:top-20">
                  <LivePreviewStudio
                    theme={activeTheme}
                    rateData={rateData}
                    ornamentImage={activeOrnamentImage}
                    logoImage={loadedLogoImg}
                    isAiStaged={isAiStaged}
                    stagingStudio={stagingStudio}
                    audioUrl={brandAssets.audioUrl}
                  />

                  <ExportCenter
                    generatedAssets={generatedAssets}
                    generating={generating}
                    progressMap={progressMap}
                    activeGeneratingIds={activeGeneratingIds}
                    posterFormat={posterFormat}
                    setPosterFormat={setPosterFormat}
                    exportFps={config.exportFps || 30}
                    hasAudio={Boolean(brandAssets.audioUrl)}
                    onGenerateAll={handleGenerateAllAssets}
                    onGenerateSingle={handleGenerateSingleAsset}
                    onDownloadAll={handleDownloadAll}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ornaments' && (
          <OrnamentManager
            ornaments={ornaments}
            selectedOrnament={selectedOrnament}
            onSelectOrnament={(item) => handleSelectOrnament(item, true)}
            onBulkUpload={handleBulkUploadOrnaments}
            onDeleteOrnament={handleDeleteOrnament}
            uploadingOrnaments={uploadingOrnaments}
            autoPickRandom={autoPickRandom}
            onToggleAutoPick={handleToggleAutoPick}
            onShuffleNow={handleShuffleNow}
            activeTheme={activeTheme}
            stagedStudioUrl={stagedStudioUrl}
            stagingStudio={stagingStudio}
            autoStageOnSelect={autoStageOnSelect}
            onToggleAutoStage={setAutoStageOnSelect}
            onGenerateStudioBackdrop={() =>
              runStudioStaging(selectedOrnament, activeTheme, { forceRegenerate: true })
            }
            onResetToOriginal={() => setStagedStudioUrl('')}
          />
        )}

        {activeTab === 'exports' && (
          <div className="space-y-5">
            <ExportCenter
              generatedAssets={generatedAssets}
              generating={generating}
              progressMap={progressMap}
              activeGeneratingIds={activeGeneratingIds}
              posterFormat={posterFormat}
              setPosterFormat={setPosterFormat}
              exportFps={config.exportFps || 30}
              hasAudio={Boolean(brandAssets.audioUrl)}
              onGenerateAll={handleGenerateAllAssets}
              onGenerateSingle={handleGenerateSingleAsset}
              onDownloadAll={handleDownloadAll}
            />
            <LivePreviewStudio
              theme={activeTheme}
              rateData={rateData}
              ornamentImage={activeOrnamentImage}
              logoImage={loadedLogoImg}
              isAiStaged={isAiStaged}
              stagingStudio={stagingStudio}
              audioUrl={brandAssets.audioUrl}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <RateHistoryPanel
            rates={rateHistory}
            loading={loadingHistory}
            onRefresh={loadWorkspaceData}
            onLoadRate={handleLoadRateFromHistory}
            onDeleteRate={handleDeleteRateHistory}
          />
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        generatedCount={generatedCount}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onConfigSaved={(updated) => {
          setConfig(updated);
          notify('Studio settings saved!', 'success');
        }}
        brandAssets={brandAssets}
        onUploadLogo={handleUploadLogo}
        onUploadAudio={handleUploadAudio}
        onRemoveAudio={handleRemoveAudio}
        uploadingBrand={uploadingBrand}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-gold-400/30 bg-[#14161D]/95 px-4 py-3 text-xs font-semibold text-stone-100 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:translate-x-0">
          {toast.type === 'success' && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          {(toast.type === 'info' || toast.type === 'warning') && (
            <Info className="h-4 w-4 shrink-0 text-gold-300" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-stone-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
