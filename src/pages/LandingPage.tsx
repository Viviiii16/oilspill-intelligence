import React, { useState, useRef } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { UploadCloud, X, AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    uploadedFile,
    setUploadedFile,
    uploadError,
    setUploadError,
    processingState,
    startImageAnalysis,
    analysisStepIndex,
    analysisTotalSteps,
  } = useInvestigation();

  const [isDragOver, setIsDragOver] = useState(false);
  const [clickError, setClickError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setClickError(null);
    const fileName = file.name.toLowerCase();
    const isValidExt = fileName.endsWith('.tif') || fileName.endsWith('.tiff');

    if (!isValidExt) {
      setUploadedFile(null);
      setUploadError('File type not compatible. Please upload a .tif or .tiff SAR image.');
      return false;
    }

    setUploadError(null);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFile({
      name: file.name,
      sizeFormatted: `${sizeInMb} MB`,
      type: 'SAR GeoTIFF',
      file,
    });
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setUploadError(null);
    setClickError(null);
    setUploadedFile({
      name: '00027.tif',
      sizeFormatted: '12.8 MB',
      type: 'SAR GeoTIFF',
    });
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setUploadError(null);
    setClickError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyseClick = () => {
    if (!uploadedFile) {
      setClickError('Upload an image first.');
      return;
    }
    setClickError(null);
    startImageAnalysis();
  };

  const isAnalysing = processingState === 'analysing-image';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 font-sans bg-[#F4F6F8] text-[#1E293B] select-none">
      <div className="w-full max-w-xl flex flex-col items-center text-center">
        {/* Main hero badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-[#D95800] text-xs font-bold mb-4 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#D95800] animate-pulse" />
          <span>SAR Deep Learning & Hydrodynamic Attribution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E293B] mb-3">
          Satellite Oil Spill Investigation
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mb-8 leading-relaxed font-normal">
          Upload a SAR observation to begin detection, reconstruction and vessel attribution.
        </p>

        {/* SAR Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploadedFile && fileInputRef.current?.click()}
          className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 p-8 flex flex-col items-center justify-center relative cursor-pointer shadow-md ${
            isDragOver
              ? 'border-[#D95800] bg-orange-50/50 shadow-lg'
              : uploadedFile
              ? 'border-[#0F62FE] bg-white cursor-default'
              : 'border-slate-300 bg-white hover:border-[#0F62FE] hover:bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tif,.tiff"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {!uploadedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F6F8] border border-slate-200 flex items-center justify-center text-[#0F62FE] mb-3.5 shadow-xs">
                <UploadCloud className="w-6 h-6 text-[#0F62FE]" />
              </div>
              <p className="text-sm font-bold text-[#1E293B] mb-1">
                Drop SAR GeoTIFF here
              </p>
              <p className="text-xs text-[#64748B] mb-3">
                or <span className="text-[#0F62FE] hover:text-[#0050E6] underline underline-offset-2 font-bold cursor-pointer">Browse files</span>
              </p>
              <span className="text-[11px] text-[#64748B]">
                Supported formats: GeoTIFF (.tif, .tiff)
              </span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
                    <span>{uploadedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {uploadedFile.type} • {uploadedFile.sizeFormatted}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sample quick loader helper */}
        {!uploadedFile && !isAnalysing && (
          <div className="mt-3.5 flex items-center gap-2 text-[11px] text-[#64748B]">
            <span>No SAR GeoTIFF on hand?</span>
            <button
              onClick={handleLoadSample}
              className="text-[#0F62FE] hover:text-[#0050E6] underline underline-offset-2 transition-colors cursor-pointer font-bold"
            >
              Load sample 00027.tif (12.8 MB)
            </button>
          </div>
        )}

        {/* Inline Error for incompatible file */}
        {uploadError && (
          <div className="w-full mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5 text-left animate-in fade-in duration-150 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">File type not compatible.</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Inline Error for no file clicked */}
        {clickError && (
          <div className="w-full mt-4 p-3 rounded-xl bg-orange-50 border border-[#D95800]/40 text-[#D95800] text-xs flex items-center gap-2.5 text-left animate-in fade-in duration-150 font-bold shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#D95800] shrink-0" />
            <span>{clickError}</span>
          </div>
        )}

        {/* Minimal Processing State */}
        {isAnalysing ? (
          <div className="w-full mt-8 p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-3.5 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs text-[#1E293B] font-bold flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#D95800] animate-spin" />
                Analysing SAR observation
              </span>
              <span className="text-[10px] text-[#0F62FE] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                STAGE {analysisStepIndex}/{analysisTotalSteps}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className={analysisStepIndex >= 1 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                  Reading GeoTIFF
                </span>
                <span className="text-[#D95800] font-bold">
                  {analysisStepIndex > 1 ? '✓' : analysisStepIndex === 1 ? '•' : '○'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={analysisStepIndex >= 2 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                  Preparing VV / VH channels
                </span>
                <span className="text-[#D95800] font-bold">
                  {analysisStepIndex > 2 ? '✓' : analysisStepIndex === 2 ? '•' : '○'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={analysisStepIndex >= 3 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                  Running oil-slick segmentation
                </span>
                <span className="text-[#D95800] font-bold">
                  {analysisStepIndex > 3 ? '✓' : analysisStepIndex === 3 ? '•' : '○'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={analysisStepIndex >= 4 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                  Extracting slick geometry
                </span>
                <span className="text-[#D95800] font-bold">
                  {analysisStepIndex >= 4 ? '✓' : '○'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Analyse Image Button */
          <div className="mt-8 w-full">
            <button
              onClick={handleAnalyseClick}
              disabled={!uploadedFile}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-150 shadow-md ${
                uploadedFile
                  ? 'bg-[#0F62FE] hover:bg-[#0050E6] text-white shadow-blue-500/20 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <span>Analyse Image</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
