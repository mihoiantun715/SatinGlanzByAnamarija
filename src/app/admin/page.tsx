'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductsContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product, Locale } from '@/lib/types';
import { Plus, Trash2, Edit3, Save, X, ShieldCheck, Package, Upload, Image as ImageIcon } from 'lucide-react';

const LOCALES: Locale[] = ['en', 'de', 'hr', 'ro', 'bg', 'tr'];
const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', de: 'DE', hr: 'HR', ro: 'RO', bg: 'BG', tr: 'TR' };

const CATEGORIES = ['Single Roses', 'Bouquets', 'Arrangements', 'Wedding', 'Gift Sets'];
const ALL_COLORS = ['Red', 'Pink', 'White', 'Burgundy', 'Peach', 'Lavender', 'Gold', 'Ivory', 'Coral', 'Mixed'];

interface ProductForm {
  slug: string;
  price: number;
  stockQuantity: number;
  imageUrls: string[];
  category: string;
  colors: string[];
  inStock: boolean;
  featured: boolean;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  shortDescription: Record<Locale, string>;
}

const emptyForm = (): ProductForm => ({
  slug: '',
  price: 0,
  stockQuantity: 0,
  imageUrls: [],
  category: 'Single Roses',
  colors: [],
  inStock: true,
  featured: false,
  name: { en: '', de: '', hr: '', ro: '', bg: '', tr: '' },
  description: { en: '', de: '', hr: '', ro: '', bg: '', tr: '' },
  shortDescription: { en: '', de: '', hr: '', ro: '', bg: '', tr: '' },
});

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { refresh } = useProducts();
  const { locale, t } = useLanguage();

  const [firestoreProducts, setFirestoreProducts] = useState<(Product & { imageUrl?: string; stockQuantity?: number })[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchProducts();
    }
  }, [authLoading, user, isAdmin]);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as (Product & { imageUrl?: string; stockQuantity?: number })[];
      data.sort((a, b) => {
        const aDate = ((a as unknown as { createdAt?: string }).createdAt) || '';
        const bDate = ((b as unknown as { createdAt?: string }).createdAt) || '';
        return bDate.localeCompare(aDate);
      });
      setFirestoreProducts(data);
    } catch {
      setFirestoreProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleNewProduct = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
    setError('');
    setActiveLocale('en');
  };

  const handleEdit = (product: Product & { imageUrl?: string; stockQuantity?: number }) => {
    const existingImages = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : []);
    setForm({
      slug: product.slug,
      price: product.price,
      stockQuantity: product.stockQuantity ?? 0,
      imageUrls: existingImages,
      category: product.category,
      colors: product.colors || [],
      inStock: product.inStock ?? true,
      featured: product.featured ?? false,
      name: { ...emptyForm().name, ...product.name },
      description: { ...emptyForm().description, ...product.description },
      shortDescription: { ...emptyForm().shortDescription, ...product.shortDescription },
    });
    setEditingId(product.id);
    setShowForm(true);
    setError('');
    setActiveLocale('en');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `products/${timestamp}_${safeName}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        newUrls.push(downloadUrl);
      }
      setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    } catch {
      setError('Failed to upload image. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm(prev => {
      const urls = [...prev.imageUrls];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= urls.length) return prev;
      [urls[index], urls[newIndex]] = [urls[newIndex], urls[index]];
      return { ...prev, imageUrls: urls };
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await fetchProducts();
      await refresh();
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete product');
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.en.trim()) { setError('English name is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    if (form.price <= 0) { setError('Price must be greater than 0'); return; }

    setSaving(true);
    try {
      const productData = {
        slug: form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        price: form.price,
        stockQuantity: form.stockQuantity,
        imageUrl: form.imageUrls[0] || '',
        images: form.imageUrls,
        category: form.category,
        colors: form.colors,
        inStock: form.inStock,
        featured: form.featured,
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString(),
        });
      }

      await fetchProducts();
      await refresh();
      setShowForm(false);
      setEditingId(null);
    } catch {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const toggleColor = (color: string) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color],
    }));
  };

  const autoSlug = () => {
    if (form.name.en && !editingId) {
      setForm(prev => ({
        ...prev,
        slug: prev.name.en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">{t.common.loading}</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Access Denied</p>
          <p className="text-sm text-gray-400 mt-1">You need admin privileges to view this page.</p>
          <a href="/" className="text-rose-500 hover:text-rose-600 text-sm font-medium mt-4 inline-block">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-rose-500" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleNewProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl p-8 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Product' : 'New Product'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <ImageIcon className="w-4 h-4 inline mr-1" /> Product Images <span className="text-gray-400 font-normal">({form.imageUrls.length})</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {form.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {form.imageUrls.map((url, i) => (
                        <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Main</div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {i > 0 && (
                              <button type="button" onClick={() => moveImage(i, -1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100">←</button>
                            )}
                            {i < form.imageUrls.length - 1 && (
                              <button type="button" onClick={() => moveImage(i, 1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100">→</button>
                            )}
                            <button type="button" onClick={() => removeImage(i)} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white hover:bg-red-600">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-rose-400 rounded-xl py-6 flex flex-col items-center justify-center gap-1.5 transition-colors bg-gray-50 hover:bg-rose-50"
                  >
                    {uploading ? (
                      <div className="text-sm text-gray-500 font-medium">Uploading...</div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{form.imageUrls.length > 0 ? 'Add more images' : 'Click to upload images'}</span>
                        <span className="text-xs text-gray-400">Select multiple files — JPG, PNG, WebP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Slug + Price + Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="my-product-slug"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          form.colors.includes(color)
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-300"
                    />
                    <span className="text-sm font-medium text-gray-700">In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured (show on homepage)</span>
                  </label>
                </div>

                {/* Locale Tabs for Name / Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Translations</label>
                  <div className="flex gap-1 mb-3">
                    {LOCALES.map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setActiveLocale(loc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeLocale === loc
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {LOCALE_LABELS[loc]}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name ({LOCALE_LABELS[activeLocale]})</label>
                      <input
                        type="text"
                        value={form.name[activeLocale]}
                        onChange={(e) => setForm({ ...form, name: { ...form.name, [activeLocale]: e.target.value } })}
                        onBlur={activeLocale === 'en' ? autoSlug : undefined}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Short Description ({LOCALE_LABELS[activeLocale]})</label>
                      <input
                        type="text"
                        value={form.shortDescription[activeLocale]}
                        onChange={(e) => setForm({ ...form, shortDescription: { ...form.shortDescription, [activeLocale]: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description ({LOCALE_LABELS[activeLocale]})</label>
                      <textarea
                        rows={3}
                        value={form.description[activeLocale]}
                        onChange={(e) => setForm({ ...form, description: { ...form.description, [activeLocale]: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product')}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900">Products ({firestoreProducts.length})</h2>
          </div>

          {loadingProducts ? (
            <div className="p-8 text-center text-gray-400">{t.common.loading}</div>
          ) : firestoreProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No products in Firestore yet.</p>
              <p className="text-sm text-gray-400">Click &quot;Add Product&quot; to create your first product.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {firestoreProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={product.imageUrl || product.images?.[0] || '/Placeholder.jpg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.name?.[locale] || product.name?.en || '—'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-rose-500">€{product.price?.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{product.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (product.stockQuantity ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {(product.stockQuantity ?? 0) > 0 ? `${product.stockQuantity} in stock` : 'Out of Stock'}
                      </span>
                      {product.featured && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">Featured</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deleteConfirm === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
