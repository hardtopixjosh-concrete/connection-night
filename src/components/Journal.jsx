import React, { useState, useRef } from 'react';
import { Camera, Calendar, Trash2, X, Save, Edit2, Image as ImageIcon, Upload, Link as LinkIcon, Heart, Download, Maximize2, Loader2 } from 'lucide-react';
import { Button } from './SharedUI';
import { supabase } from '../supabase';
import { compressImage } from '../utils/imageCompression';
import { haptic } from '../utils/haptics'; 

export default function Journal({ profile, history, onAddMemory, onDeleteMemory, onUpdateMemory, theme }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const fileInputRef = useRef(null);
  
  const [editingMemory, setEditingMemory] = useState(null);
  const [viewingImage, setViewingImage] = useState(null); 
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState(''); 
  const [fileToUpload, setFileToUpload] = useState(null); 
  const [rating, setRating] = useState(5); 
  const [inputType, setInputType] = useState('upload'); 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file); 
      const reader = new FileReader();
      reader.onloadend = () => setNewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToSupabase = async (file) => {
    // Compress image before upload
    const compressedFile = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8
    });

    const fileExt = compressedFile.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('memories').upload(filePath, compressedFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('memories').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
        let finalImageUrl = newImage;
        if (fileToUpload) finalImageUrl = await uploadImageToSupabase(fileToUpload);
        await onAddMemory({ title: newTitle, notes: newDesc, image_url: finalImageUrl, intensity: 'medium', rating: rating });
        haptic.success();
        resetForm();
    } catch (error) { haptic.error(); alert("Error uploading: " + error.message); } finally { setIsUploading(false); }
  };

  const resetForm = () => {
    setIsAdding(false);
    setNewTitle(''); 
    setNewDesc(''); 
    setNewImage('');
    setFileToUpload(null);
    setRating(5);
  };

  const openEdit = (memory) => {
    setEditingMemory(memory);
    setNewTitle(memory.title);
    setNewDesc(memory.notes || '');
    setNewImage(memory.image_url || '');
    setFileToUpload(null);
    setRating(memory.rating || 5);
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    setIsUploading(true);
    try {
        let finalImageUrl = newImage;
        if (fileToUpload) finalImageUrl = await uploadImageToSupabase(fileToUpload);
        await onUpdateMemory(editingMemory.id, { title: newTitle, notes: newDesc, image_url: finalImageUrl, rating: rating });
        setEditingMemory(null);
    } catch (e) { alert("Update failed: " + e.message); } finally { setIsUploading(false); }
  };

  const handleDelete = () => {
    if (!editingMemory) return;
    if (window.confirm("Delete this memory forever?")) {
      onDeleteMemory(editingMemory.id);
      setEditingMemory(null);
    }
  };

  const getIntensityStyles = (intensity) => {
    switch (intensity) {
      case 'high': return 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
      case 'medium': return 'bg-orange-950/20 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
      case 'low': return 'bg-blue-950/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
      default: return 'bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Journal</h1>
          <p className="text-zinc-400 text-sm mt-1">Shared history & tokens.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-white text-black p-4 rounded-xl shadow-lg hover:scale-105 transition-all">
          <Camera size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-800 p-6 animate-in zoom-in-95 flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Log Memory</h2>
              <button onClick={resetForm} className="bg-zinc-800 p-2 rounded-full"><X size={20} className="text-zinc-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Memory Image</label>
                {newImage ? (
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-zinc-700 group">
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => {setNewImage(''); setFileToUpload(null);}} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => fileInputRef.current.click()} className={`p-4 rounded-xl border border-dashed flex flex-col items-center gap-2 transition-all ${inputType === 'upload' ? `${theme.borderStrong} ${theme.bgSoft} ${theme.textLight}` : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                      <Camera size={24} />
                      <span className="text-[10px] font-bold uppercase">Camera / Upload</span>
                    </button>
                    <button type="button" onClick={() => setInputType('link')} className={`p-4 rounded-xl border border-dashed flex flex-col items-center gap-2 transition-all ${inputType === 'link' ? `${theme.borderStrong} ${theme.bgSoft} ${theme.textLight}` : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                      <LinkIcon size={24} />
                      <span className="text-[10px] font-bold uppercase">Paste Link</span>
                    </button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                {inputType === 'link' && !newImage && (
                  <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs mt-2" value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://..." />
                )}
              </div>

              <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Title</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mt-1 font-bold" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Date Night..." /></div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rating</label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                      <Heart size={28} fill={star <= rating ? "#ef4444" : "none"} className={star <= rating ? "text-rose-500" : "text-zinc-700"} />
                    </button>
                  ))}
                </div>
              </div>

              <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Details</label><textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mt-1 h-24 text-sm" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Notes..." /></div>

              <button type="submit" disabled={isUploading} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${theme.solid} text-white ${theme.glow}`}>
                {isUploading ? <Loader2 className="animate-spin mx-auto" /> : "Save to History"}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingMemory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-zinc-900 w-full max-w-sm rounded-3xl border overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh] ${getIntensityStyles(editingMemory.intensity)}`}>
            
            <div className="relative h-64 bg-zinc-950 flex items-center justify-center group shrink-0">
               {newImage ? (
                 <div className="w-full h-full relative cursor-pointer" onClick={() => setViewingImage(newImage)}>
                    <img src={newImage} alt="Memory" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="text-white drop-shadow-lg" />
                    </div>
                 </div>
               ) : (
                 <div className="text-zinc-700 flex flex-col items-center gap-2"><ImageIcon size={32} /><span className="text-xs font-bold uppercase tracking-widest">No Image</span></div>
               )}
               
               <button onClick={() => setEditingMemory(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur z-10"><X size={20} className="text-white" /></button>
               
               <button onClick={() => fileInputRef.current.click()} className="absolute bottom-4 right-4 bg-white/90 text-black px-3 py-2 rounded-lg text-xs font-bold shadow-lg uppercase tracking-wider flex items-center gap-2 z-10">
                 <Camera size={14} /> Change
               </button>
               <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
               <div>
                 <input className="bg-transparent text-2xl font-bold text-white w-full focus:outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                 <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> {new Date(editingMemory.created_at).toLocaleDateString()}</p>
               </div>

               <div>
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Rating</label>
                 <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 active:scale-95 transition-transform">
                        <Heart size={24} fill={star <= rating ? "#ef4444" : "none"} className={star <= rating ? "text-rose-500" : "text-zinc-700"} />
                        </button>
                    ))}
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Notes</label>
                 <textarea 
                   className="w-full bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-4 text-zinc-300 text-sm leading-relaxed focus:border-violet-500 focus:outline-none transition-colors" 
                   value={newDesc} 
                   onChange={e => setNewDesc(e.target.value)} 
                   rows={6}
                 />
               </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur flex gap-3 shrink-0">
               <button onClick={handleDelete} className="p-4 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"><Trash2 size={20} /></button>
               <button onClick={handleSaveEdit} className="flex-1 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2" disabled={isUploading}>
                   {isUploading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULLSCREEN IMAGE LIGHTBOX --- */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-in fade-in duration-200">
            <div className="absolute top-4 right-4 flex gap-4 z-20">
                <a href={viewingImage} download={`memory-${Date.now()}.jpg`} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 backdrop-blur transition-all">
                    <Download size={24} />
                </a>
                <button onClick={() => setViewingImage(null)} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 backdrop-blur transition-all">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                <img src={viewingImage} alt="Full size" className="max-w-full max-h-full object-contain" />
            </div>
        </div>
      )}

      {/* --- HISTORY LIST --- */}
      <div className="grid gap-4">
        {history.map(item => {
          const intensityStyle = getIntensityStyles(item.intensity || 'medium');
          return (
            <div 
              key={item.id} 
              onClick={() => openEdit(item)}
              className={`group relative overflow-hidden rounded-3xl border transition-all cursor-pointer active:scale-98 ${intensityStyle}`}
            >
              <div className="flex h-28">
                {item.image_url ? (
                  <div className="w-28 relative shrink-0">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                ) : (
                  <div className="w-3 bg-zinc-800/50 shrink-0" /> 
                )}
                
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-white font-bold leading-tight line-clamp-1">{item.title}</h3>
                        <div className="flex gap-0.5 ml-2">
                            {[1,2,3,4,5].map(star => (
                                <Heart key={star} size={10} fill={star <= (item.rating || 0) ? "currentColor" : "none"} className={star <= (item.rating || 0) ? "text-rose-500" : "text-zinc-800"} />
                            ))}
                        </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 opacity-70 mt-1 block">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {item.notes && <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed opacity-90">{item.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
        {history.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 font-bold">No memories logged yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Complete a sync to start your journal.</p>
          </div>
        )}
      </div>
    </div>
  );
}