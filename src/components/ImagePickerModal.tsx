import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Upload,
  Link2,
  Sparkles,
  Info,
  ShieldCheck,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { FreeImageResult } from '../types';
import { EDUCATIONAL_DIAGRAMS, DIAGRAM_CATEGORIES, findMatchingDiagrams } from '../data/educationalDiagrams';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageData: { url: string; caption?: string; alt?: string }) => void;
  initialQuery?: string;
  currentImageUrl?: string;
  currentCaption?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = '',
  currentImageUrl = '',
  currentCaption = '',
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'url' | 'upload'>('library');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState<FreeImageResult | null>(null);
  const [customCaption, setCustomCaption] = useState(currentCaption);
  const [directUrl, setDirectUrl] = useState(currentImageUrl);
  const [urlPreviewValid, setUrlPreviewValid] = useState(false);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [wikiResults, setWikiResults] = useState<FreeImageResult[]>([]);
  const [previewZoom, setPreviewZoom] = useState<string | null>(null);

  // Set initial selected image if currentImageUrl matches something
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery || '');
      setCustomCaption(currentCaption || '');
      setDirectUrl(currentImageUrl || '');
      setSelectedCategory('All');

      if (currentImageUrl) {
        const found = EDUCATIONAL_DIAGRAMS.find((d) => d.url === currentImageUrl);
        if (found) {
          setSelectedImage(found);
        } else {
          setSelectedImage({
            id: 'current',
            title: 'Current Diagram',
            url: currentImageUrl,
            thumbUrl: currentImageUrl,
            caption: currentCaption || 'Educational Diagram',
            license: 'Custom / Web',
            source: 'Selected',
            category: 'Current',
          });
        }
      } else {
        setSelectedImage(null);
      }
    }
  }, [isOpen, initialQuery, currentImageUrl, currentCaption]);

  // Live Wikimedia Commons search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setWikiResults([]);
      setIsSearchingWiki(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingWiki(true);
      try {
        const resp = await fetch(`/api/search-free-images?q=${encodeURIComponent(searchQuery.trim())}`);
        const contentType = resp.headers.get('content-type') || '';
        if (resp.ok && contentType.includes('application/json')) {
          const data = await resp.json();
          setWikiResults(data.results || []);
        } else {
          // Direct client-side Wikimedia Commons query for static hosts (Cloudflare Pages)
          const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&origin=*&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
            searchQuery.trim() + ' diagram OR drawing'
          )}&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json`;

          const clientResp = await fetch(wikiUrl);
          if (clientResp.ok) {
            const wikiData = await clientResp.json();
            const pages = Object.values(wikiData?.query?.pages || {});
            const clientResults = pages
              .map((page: any) => {
                const info = page.imageinfo?.[0];
                if (!info || !info.url) return null;
                const title = (page.title || '')
                  .replace(/^File:/i, '')
                  .replace(/\.[^/.]+$/, '')
                  .replace(/_/g, ' ');

                if (!info.url.match(/\.(png|jpg|jpeg|svg|webp)($|\?)/i)) return null;

                return {
                  id: `wiki-${page.pageid}`,
                  title,
                  url: info.url,
                  thumbUrl: info.thumburl || info.url,
                  caption: `Figure: ${title}`,
                  license: info.extmetadata?.LicenseShortName?.value || 'Creative Commons',
                  source: 'Wikimedia Commons',
                  category: 'Wikimedia Search',
                };
              })
              .filter(Boolean) as FreeImageResult[];
            setWikiResults(clientResults);
          }
        }
      } catch (e) {
        console.warn('Failed to search Wikimedia free images:', e);
      } finally {
        setIsSearchingWiki(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter curated diagrams
  const displayedImages = useMemo(() => {
    let list: FreeImageResult[] = [];

    if (wikiResults.length > 0) {
      list = wikiResults;
    } else {
      list = findMatchingDiagrams(searchQuery);
    }

    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    return list;
  }, [wikiResults, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleSelectCard = (item: FreeImageResult) => {
    setSelectedImage(item);
    if (!customCaption || customCaption === currentCaption) {
      setCustomCaption(item.caption);
    }
  };

  const handleConfirmInsert = () => {
    if (activeTab === 'library' && selectedImage) {
      onSelectImage({
        url: selectedImage.url,
        caption: customCaption.trim() || selectedImage.caption,
        alt: selectedImage.title,
      });
      onClose();
    } else if (activeTab === 'url' && directUrl.trim()) {
      onSelectImage({
        url: directUrl.trim(),
        caption: customCaption.trim() || 'Figure: Educational Reference Diagram',
        alt: 'User provided diagram',
      });
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSelectImage({
        url: dataUrl,
        caption: customCaption.trim() || `Figure: ${file.name.replace(/\.[^/.]+$/, '')}`,
        alt: file.name,
      });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Free Non-Copyright Educational Diagrams</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/25 border border-white/30">
                  Wikimedia & CC Free
                </span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                Add public domain diagrams for identification questions, anatomy, science, and math
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'library'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search Free Diagrams (Wikimedia & Archive)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Direct Image URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Diagram</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'library' && (
            <>
              {/* Search Bar & Instant Categories */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search free diagrams: digestive system, stomach, heart, cell, water cycle, volcano, atom..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {isSearchingWiki && (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {!isSearchingWiki && searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {DIAGRAM_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free License Notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>100% Free & Educational:</strong> All diagrams are sourced from Wikimedia Commons and public domain repositories (CC-BY, CC-BY-SA, or Public Domain).
                </span>
              </div>

              {/* Diagrams Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedImages.map((item) => {
                  const isSelected = selectedImage?.url === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCard(item)}
                      className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col justify-between bg-white text-left ${
                        isSelected
                          ? 'border-2 border-indigo-600 ring-2 ring-indigo-200 shadow-md bg-indigo-50/30'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-100 relative mb-2 flex items-center justify-center">
                        <img
                          src={item.thumbUrl || item.url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewZoom(item.url);
                          }}
                          title="Zoom diagram"
                          className="opacity-0 group-hover:opacity-100 absolute bottom-1.5 right-1.5 p-1 rounded-md bg-slate-900/70 text-white hover:bg-slate-900 transition-opacity"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card Details */}
                      <div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">
                          {item.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[90px]">{item.source}</span>
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            Free
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedImages.length === 0 && !isSearchingWiki && (
                <div className="text-center py-10 text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-600">No diagrams found for "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try searching for general terms like "digestive", "stomach", "heart", "cell", or "solar system".
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4 max-w-lg mx-auto py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Image or Diagram URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="https://example.com/diagram.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports HTTPS links to PNG, SVG, JPG, and WebP diagrams.
                </p>
              </div>

              {/* URL Preview */}
              {directUrl && (
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Diagram Preview
                  </span>
                  <img
                    src={directUrl}
                    alt="URL preview"
                    referrerPolicy="no-referrer"
                    className="max-h-48 mx-auto rounded-lg object-contain bg-white border border-slate-200"
                    onError={() => setUrlPreviewValid(false)}
                    onLoad={() => setUrlPreviewValid(true)}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 max-w-lg mx-auto py-6 text-center">
              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-8 block cursor-pointer transition-colors bg-indigo-50/20 hover:bg-indigo-50/50">
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <span className="text-sm font-bold text-slate-800 block">Click to upload or drag image here</span>
                <span className="text-xs text-slate-400 mt-1 block">
                  PNG, JPG, SVG, WebP up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Caption Input Field (Shown whenever an image is selected or provided) */}
          {(selectedImage || (activeTab === 'url' && directUrl)) && (
            <div className="pt-3 border-t border-slate-200 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Figure Caption / Identification Label
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Displayed directly below diagram on student sheets
                </span>
              </div>
              <input
                type="text"
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                placeholder="e.g. Figure 1: Anatomical diagram of the human digestive system"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 truncate max-w-sm">
            {selectedImage ? (
              <span className="font-medium text-slate-700">
                Selected: <strong>{selectedImage.title}</strong>
              </span>
            ) : (
              <span>Select a diagram above to attach to this question</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              disabled={
                (activeTab === 'library' && !selectedImage) ||
                (activeTab === 'url' && !directUrl)
              }
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs shadow-indigo-200 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Attach Diagram</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {previewZoom && (
        <div
          onClick={() => setPreviewZoom(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewZoom(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewZoom}
              alt="Zoomed diagram"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
