
import React, { useState, useCallback } from 'react';
import type { GenerationOptions, Theme, AspectRatio, Quality } from './types';
import { KOREAN_FASHION_CONCEPTS, ENTREPRENEUR_CONCEPTS, HANOI_WINTER_CONCEPTS, INTERNATIONAL_MODEL_CONCEPTS, FLOWER_MUSE_CONCEPTS, CHRISTMAS_CONCEPTS, PRINCESS_MUSE_CONCEPTS, CHRISTMAS_COUPLE_CONCEPTS, CUSTOM_CONCEPTS, SINGER_CONCEPTS } from './constants/prompts';
import { fileToBase64, generateImageWithNanoBanana } from './services/geminiService';
import { UploadIcon, DownloadIcon, SparklesIcon, AlertTriangleIcon, CopyIcon } from './components/icons';

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [secondImage, setSecondImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [gallery, setGallery] = useState<string[]>([]);
    const [options, setOptions] = useState<GenerationOptions>({
        theme: 'korean',
        concept: KOREAN_FASHION_CONCEPTS[0],
        aspectRatio: '3:4',
        quality: 'High',
        faceConsistency: true,
        customPrompt: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isSecond: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            const previewUrl = URL.createObjectURL(file);
            if (isSecond) {
                setSecondImage({ file, base64, previewUrl });
            } else {
                setOriginalImage({ file, base64, previewUrl });
            }
            setGeneratedImage(null);
            setGeneratedPrompt(null);
            setError(null);
        }
    };

    const handleGenerateImage = useCallback(async () => {
        const isCoupleMode = options.theme === 'christmas_couple';
        const isCustomMode = options.theme === 'custom';

        if (isCoupleMode && (!originalImage || !secondImage)) {
            setError("Vui lòng tải đủ 2 ảnh (Người 1 và Người 2) cho chế độ cặp đôi.");
            return;
        }

        if (!isCoupleMode && !originalImage) {
            setError("Vui lòng tải ảnh gốc lên trước.");
            return;
        }

        if (isCustomMode && !options.customPrompt?.trim()) {
            setError("Vui lòng nhập mô tả cho ảnh bạn muốn tạo.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setGeneratedPrompt(null);

        try {
            const result = await generateImageWithNanoBanana(
                originalImage!.base64,
                originalImage!.file.type,
                options,
                (isCoupleMode && secondImage) ? { base64: secondImage.base64, mimeType: secondImage.file.type } : null
            );
            const newImageUrl = `data:image/png;base64,${result.image}`;
            setGeneratedImage(newImageUrl);
            setGeneratedPrompt(result.prompt);
            setGallery(prev => [newImageUrl, ...prev].slice(0, 36));
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Đã xảy ra lỗi không xác định.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, secondImage, options]);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `anh_ai_cao_cap_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = () => {
        if (generatedPrompt) {
            navigator.clipboard.writeText(generatedPrompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const getConcepts = (theme: Theme) => {
        switch (theme) {
            case 'korean': return KOREAN_FASHION_CONCEPTS;
            case 'entrepreneur': return ENTREPRENEUR_CONCEPTS;
            case 'hanoi_winter': return HANOI_WINTER_CONCEPTS;
            case 'international_model': return INTERNATIONAL_MODEL_CONCEPTS;
            case 'flower_muse': return FLOWER_MUSE_CONCEPTS;
            case 'christmas': return CHRISTMAS_CONCEPTS;
            case 'princess_muse': return PRINCESS_MUSE_CONCEPTS;
            case 'christmas_couple': return CHRISTMAS_COUPLE_CONCEPTS;
            case 'singer': return SINGER_CONCEPTS;
            case 'custom': return CUSTOM_CONCEPTS;
            default: return KOREAN_FASHION_CONCEPTS;
        }
    };

    const concepts = getConcepts(options.theme);

    const getThemeLabel = (theme: Theme) => {
        switch (theme) {
            case 'korean': return 'Hàn Quốc';
            case 'entrepreneur': return 'Doanh nhân';
            case 'hanoi_winter': return 'Hà Nội Đông';
            case 'international_model': return 'Siêu Mẫu QT';
            case 'flower_muse': return 'Nàng Thơ & Hoa';
            case 'christmas': return 'Giáng Sinh';
            case 'princess_muse': return 'Công Chúa';
            case 'christmas_couple': return 'Cặp Đôi Noel';
            case 'singer': return 'Ca Sỹ';
            case 'custom': return 'Tự Do';
        }
    };

    const getQualityLabel = (q: Quality) => {
        switch (q) {
            case 'Standard': return 'Tiêu chuẩn';
            case 'High': return 'Cao';
            case 'Ultra': return 'Siêu nét';
        }
    };

    const isCoupleMode = options.theme === 'christmas_couple';
    const isCustomMode = options.theme === 'custom';

    const themes: Theme[] = ['korean', 'entrepreneur', 'hanoi_winter', 'international_model', 'flower_muse', 'christmas', 'princess_muse', 'christmas_couple', 'singer', 'custom'];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-400">
                        ✨ ẢNH AI CAO CẤP ✨
                    </h1>
                    <p className="text-gray-400 mt-2">Studio biến hình phong cách chuyên nghiệp</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel */}
                    <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                        {/* Step 1: Upload */}
                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-semibold flex items-center gap-2"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-gray-900 font-bold">1</span> {isCoupleMode ? 'Tải 2 Ảnh (Ghép đôi)' : 'Tải Ảnh Gốc'}</h2>
                            
                            <div className={`${isCoupleMode ? 'grid grid-cols-2 gap-4' : 'w-full'}`}>
                                {/* Image 1 Uploader */}
                                <div className="flex flex-col gap-2">
                                    {isCoupleMode && <span className="text-sm text-gray-400 text-center font-medium">Người 1</span>}
                                    <label htmlFor="file-upload-1" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-teal-400 hover:bg-gray-800 transition-colors relative overflow-hidden`}>
                                        {originalImage ? (
                                            <img src={originalImage.previewUrl} alt="Ảnh gốc 1" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-gray-400 p-2">
                                                <UploadIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-2" />
                                                <p className="text-xs sm:text-sm">Tải ảnh</p>
                                            </div>
                                        )}
                                    </label>
                                    <input id="file-upload-1" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleImageUpload(e, false)} />
                                </div>

                                {/* Image 2 Uploader - Only visible in couple mode */}
                                {isCoupleMode && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-gray-400 text-center font-medium">Người 2</span>
                                        <label htmlFor="file-upload-2" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-teal-400 hover:bg-gray-800 transition-colors relative overflow-hidden`}>
                                            {secondImage ? (
                                                <img src={secondImage.previewUrl} alt="Ảnh gốc 2" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-gray-400 p-2">
                                                    <UploadIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-2" />
                                                    <p className="text-xs sm:text-sm">Tải ảnh</p>
                                                </div>
                                            )}
                                        </label>
                                        <input id="file-upload-2" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleImageUpload(e, true)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Select Concept */}
                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-semibold flex items-center gap-2"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-gray-900 font-bold">2</span> {isCustomMode ? 'Nhập Mô Tả Của Bạn' : 'Chọn Chủ Đề & Concept'}</h2>
                             {/* Theme Tabs - Dynamic grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1 bg-gray-900 rounded-lg">
                                {themes.map(theme => (
                                    <button key={theme} onClick={() => setOptions(o => ({ ...o, theme, concept: getConcepts(theme)[0] }))} className={`px-1 py-2 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${options.theme === theme ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                                        {getThemeLabel(theme)}
                                    </button>
                                ))}
                            </div>
                             
                             {/* Concept Grid - Hidden if Custom Mode */}
                             {!isCustomMode && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2">
                                    {concepts.map(concept => (
                                        <button key={concept} onClick={() => setOptions(o => ({...o, concept}))} className={`p-2 text-xs text-center rounded-md transition-colors ${options.concept === concept ? 'bg-cyan-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {concept}
                                        </button>
                                    ))}
                                </div>
                             )}

                             {/* Custom Prompt Text Area - Always visible but emphasized in Custom mode */}
                            <div className="mt-2">
                                <label className="text-sm text-gray-400 mb-1 block">
                                    {isCustomMode ? 'Nhập prompt chi tiết để tạo ảnh (Bắt buộc):' : 'Mô tả chi tiết thêm (Tuỳ chọn):'}
                                </label>
                                <textarea
                                    className={`w-full bg-gray-900 border rounded-lg p-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder-gray-600 ${isCustomMode ? 'border-teal-500/50 min-h-[120px]' : 'border-gray-700'}`}
                                    rows={isCustomMode ? 5 : 3}
                                    placeholder={isCustomMode ? "Ví dụ: Một cô gái đang ngồi đọc sách bên cửa sổ trời mưa, ánh sáng ấm áp, phong cách cổ điển..." : "Ví dụ: Thêm khăn quàng cổ màu đỏ, nền trời đang mưa..."}
                                    value={options.customPrompt || ''}
                                    onChange={(e) => setOptions(o => ({ ...o, customPrompt: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Step 3: Customize */}
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-gray-900 font-bold">3</span> Tuỳ Chỉnh</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Face Consistency */}
                                <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                    <span className="font-medium">Giữ nguyên khuôn mặt</span>
                                    <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${options.faceConsistency ? 'bg-teal-500' : 'bg-gray-600'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${options.faceConsistency ? 'translate-x-6' : 'translate-x-1'}`} />
                                        <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer" checked={options.faceConsistency} onChange={e => setOptions(o => ({...o, faceConsistency: e.target.checked}))} />
                                    </div>
                                </label>
                                {/* Aspect Ratio */}
                                <div className="p-3 bg-gray-900 rounded-lg">
                                    <span className="font-medium mb-2 block">Tỷ lệ ảnh</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['1:1', '3:4', '9:16'] as AspectRatio[]).map(ratio => (
                                            <button key={ratio} onClick={() => setOptions(o => ({...o, aspectRatio: ratio}))} className={`px-2 py-1 text-sm rounded ${options.aspectRatio === ratio ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{ratio}</button>
                                        ))}
                                    </div>
                                </div>
                                {/* Quality */}
                                 <div className="p-3 bg-gray-900 rounded-lg sm:col-span-2">
                                    <span className="font-medium mb-2 block">Chất lượng</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Standard', 'High', 'Ultra'] as Quality[]).map(q => (
                                            <button key={q} onClick={() => setOptions(o => ({...o, quality: q}))} className={`px-2 py-1 text-sm rounded ${options.quality === q ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                                {getQualityLabel(q)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button onClick={handleGenerateImage} disabled={isLoading || (isCoupleMode ? (!originalImage || !secondImage) : !originalImage)} className="w-full flex items-center justify-center gap-2 py-4 px-6 text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                           {isLoading ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 AI đang sáng tạo...
                                </>
                            ) : (
                                "TẠO ẢNH"
                            )}
                        </button>
                    </div>

                    {/* Right Panel */}
                    <div className="flex flex-col gap-6">
                        {/* Result */}
                        <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 min-h-[300px] lg:min-h-0 lg:flex-grow flex flex-col items-center justify-center">
                            <h2 className="text-xl font-semibold mb-4 w-full">Kết quả</h2>
                            <div className="w-full flex-grow flex items-center justify-center relative aspect-[3/4] max-w-md bg-gray-900 rounded-lg">
                                {isLoading && (
                                    <div className="flex flex-col items-center text-teal-300">
                                        <SparklesIcon className="w-16 h-16 animate-pulse" />
                                        <p className="mt-2">Đang tạo ảnh, vui lòng đợi...</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex flex-col items-center text-red-400 text-center p-4">
                                        <AlertTriangleIcon className="w-12 h-12 mb-2" />
                                        <p className="font-semibold">Tạo ảnh không thành công</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                                {generatedImage && (
                                    <>
                                        <img src={generatedImage} alt="Ảnh được tạo bởi AI" className="w-full h-full object-contain rounded-lg"/>
                                        <button onClick={handleDownload} className="absolute bottom-4 right-4 bg-teal-500/80 text-white p-3 rounded-full hover:bg-teal-500 backdrop-blur-sm transition-all">
                                            <DownloadIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                                {!isLoading && !error && !generatedImage && (
                                     <div className="text-center text-gray-500">
                                        <p>Ảnh của bạn sẽ xuất hiện ở đây.</p>
                                    </div>
                                )}
                            </div>

                            {/* Prompt Display Section */}
                            {generatedPrompt && (
                                <div className="w-full mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700 relative group">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-semibold text-gray-400">Prompt đã sử dụng:</h3>
                                        <button 
                                            onClick={handleCopyPrompt} 
                                            className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium ${copySuccess ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                            title="Sao chép prompt"
                                        >
                                            {copySuccess ? 'Đã sao chép!' : <><CopyIcon className="w-4 h-4" /> Sao chép</>}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono text-xs">{generatedPrompt}</p>
                                </div>
                            )}
                        </div>

                        {/* Gallery */}
                        {gallery.length > 0 && (
                             <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                                <h2 className="text-xl font-semibold mb-4">Ảnh đã tạo gần đây</h2>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {gallery.map((img, index) => (
                                        <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-700">
                                             <img src={img} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover"/>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;