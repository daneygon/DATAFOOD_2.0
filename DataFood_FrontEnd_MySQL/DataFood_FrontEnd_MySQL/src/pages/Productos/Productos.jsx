import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory,
    getProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus
} from '../../api/productosApi';
import './Productos.css';


const API = import.meta.env.VITE_API_URL;

export default function Productos() {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'lista');

    const [categories, setCategories] = useState([]);
    const [products,   setProducts]   = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');

    const [selectedCatTab, setSelectedCatTab] = useState(null);
    const [searchList,     setSearchList]     = useState('');
    const [filterStatus,   setFilterStatus]   = useState('');
    const [filterLetter,   setFilterLetter]   = useState('');

    const [catForm,  setCatForm]  = useState({ id: null, name: '' });
    // ── description agregado ──
    const [prodForm, setProdForm] = useState({ id: null, name: '', productCategoryId: '', price: '', description: '' });
    const [errors,   setErrors]   = useState({});

    const [adminSearch,    setAdminSearch]    = useState('');
    const [adminCatFilter, setAdminCatFilter] = useState('');

    const [imageFile,    setImageFile]    = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);


    useEffect(() => { loadCategories(); }, []);
    useEffect(() => { loadProducts(); }, [selectedCatTab, filterStatus, searchList, filterLetter]);
    useEffect(() => { if (location.state?.view) setView(location.state.view); }, [location.state]);


    const loadCategories = async () => {
        try {
            const { data } = await getProductCategories();
            setCategories(data);
        } catch { setError('No se pudieron cargar las categorías.'); }
    };

    const loadProducts = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = {};
            if (selectedCatTab !== null) params.categoryId = selectedCatTab;
            if (filterStatus !== '')     params.status     = filterStatus;
            if (searchList.trim())       params.search     = searchList.trim();
            if (filterLetter)            params.letter     = filterLetter;
            const { data } = await getProducts(params);
            const filtered = filterLetter
                ? data.filter(p => p.name.toUpperCase().startsWith(filterLetter))
                : data;
            setProducts(filtered);
        } catch { setError('No se pudieron cargar los productos.'); }
        finally  { setLoading(false); }
    }, [selectedCatTab, filterStatus, searchList, filterLetter]);

    const handleToggleStatus = async (id) => {
        try {
            const { data: updated } = await toggleProductStatus(id);
            setProducts(prev => prev.map(p => p.productId === id ? updated : p));
        } catch { setError('Error al cambiar el estado del producto.'); }
    };

    const validateCategory = () => {
        const errs = {};
        if (!catForm.name.trim()) errs.catName = 'El nombre es obligatorio.';
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(catForm.name)) errs.catName = 'Solo letras.';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    const validateProduct = () => {
        const errs = {};
        if (!prodForm.name.trim())       errs.prodName     = 'El nombre es obligatorio.';
        if (!prodForm.productCategoryId) errs.prodCategory = 'Seleccione una categoría.';
        if (!prodForm.price || isNaN(prodForm.price) || Number(prodForm.price) <= 0)
            errs.prodPrice = 'Debe ser mayor a 0.';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    const uploadImage = async (productId) => {
        if (!imageFile) return;
        const formData = new FormData();
        formData.append('image', imageFile);
        await fetch(`${API}/api/products/${productId}/image`, { method: 'POST', body: formData });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const resetProdForm = () => {
        // ── description incluido en reset ──
        setProdForm({ id: null, name: '', productCategoryId: '', price: '', description: '' });
        setErrors({});
        clearImage();
    };

    const handleSaveNewCat = async () => {
        if (!validateCategory()) return;
        try {
            await createProductCategory({ name: catForm.name });
            setCatForm({ id: null, name: '' }); setErrors({});
            await loadCategories();
        } catch (e) { setError(e.response?.data?.message || 'Error al guardar categoría.'); }
    };

    const handleSaveEditCat = async () => {
        if (!catForm.id || !validateCategory()) return;
        try {
            await updateProductCategory(catForm.id, { name: catForm.name });
            setCatForm({ id: null, name: '' }); setErrors({});
            await loadCategories(); await loadProducts();
        } catch (e) { setError(e.response?.data?.message || 'Error al actualizar categoría.'); }
    };

    const handleDeleteCat = async (id) => {
        if (!window.confirm('¿Eliminar esta categoría?')) return;
        try { await deleteProductCategory(id); await loadCategories(); await loadProducts(); }
        catch { setError('No se puede eliminar: tiene platillos asociados.'); }
    };

    const handleSaveNewProd = async () => {
        if (!validateProduct()) return;
        try {
            const { data: created } = await createProduct({
                name:              prodForm.name,
                productCategoryId: Number(prodForm.productCategoryId),
                price:             Number(prodForm.price),
                description:       prodForm.description.trim() || null, // ── nuevo
            });
            if (imageFile) await uploadImage(created.productId);
            resetProdForm();
            await loadProducts();
        } catch (e) { setError(e.response?.data?.message || 'Error al guardar producto.'); }
    };

    const handleSaveEditProd = async () => {
        if (!prodForm.id || !validateProduct()) return;
        try {
            await updateProduct(prodForm.id, {
                name:              prodForm.name,
                productCategoryId: Number(prodForm.productCategoryId),
                price:             Number(prodForm.price),
                description:       prodForm.description.trim() || null, // ── nuevo
            });
            if (imageFile) await uploadImage(prodForm.id);
            resetProdForm();
            await loadProducts();
        } catch (e) { setError(e.response?.data?.message || 'Error al actualizar producto.'); }
    };

    const handleDeleteProd = async (id) => {
        if (!window.confirm('¿Eliminar este platillo?')) return;
        try { await deleteProduct(id); await loadProducts(); }
        catch { setError('Error al eliminar el platillo.'); }
    };

    // ── description cargado al editar ──
    const handleEditProd = (prod) => {
        setProdForm({
            id:                prod.productId,
            name:              prod.name,
            productCategoryId: prod.productCategoryId,
            price:             prod.price,
            description:       prod.description || '',
        });
        setErrors({});
        clearImage();
        if (prod.imageUrl) setImagePreview(`${API}${prod.imageUrl}`);
    };

    const adminFiltered = products.filter(p => {
        const matchName = p.name.toLowerCase().includes(adminSearch.toLowerCase());
        const matchCat  = !adminCatFilter || p.productCategoryId === Number(adminCatFilter);
        return matchName && matchCat;
    });

    const getProductImage = (prod) =>
        prod.imageUrl ? `${API}${prod.imageUrl}` : null;

    return (
        <div className="prod-page">
            <div className="prod-top-actions">
                <button className="btn-regresar" onClick={() => navigate('/')}>Principal</button>
                <button className="btn-admin-toggle" onClick={() => setView(view === 'lista' ? 'admin' : 'lista')}>
                    {view === 'lista' ? '⚙️ Administrar Productos y Categorías' : '📋 Ver Lista de Productos'}
                </button>
            </div>

            {error && (
                <div className="prod-error">
                    {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* ══════════════ VISTA LISTA ══════════════ */}
            {view === 'lista' && (
                <div className="prod-list-container">
                    <div className="prod-filters">
                        <select className="prod-select" value={selectedCatTab ?? ''} onChange={e => setSelectedCatTab(e.target.value === '' ? null : Number(e.target.value))}>
                            <option value="">Categoría</option>
                            {categories.map(c => <option key={c.productCategoryId} value={c.productCategoryId}>{c.name}</option>)}
                        </select>
                        <select className="prod-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">Estado</option>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                        <select
                            className={`prod-letter-select ${filterLetter ? 'active-filter' : ''}`}
                            value={filterLetter}
                            onChange={e => setFilterLetter(e.target.value)}
                        >
                            <option value="">A – Z</option>
                            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                        <div className="prod-search">
                            <span>🔍</span>
                            <input type="text" placeholder="Buscar platillo..." value={searchList} onChange={e => setSearchList(e.target.value)} />
                        </div>
                    </div>

                    <div className="prod-tabs">
                        <button className={`prod-tab ${selectedCatTab === null ? 'active' : ''}`} onClick={() => setSelectedCatTab(null)}>Todos</button>
                        {categories.map(c => (
                            <button key={c.productCategoryId} className={`prod-tab ${selectedCatTab === c.productCategoryId ? 'active' : ''}`} onClick={() => setSelectedCatTab(c.productCategoryId)}>{c.name}</button>
                        ))}
                    </div>

                    {loading ? <p style={{ padding: '20px', textAlign: 'center' }}>Cargando...</p> : (
                        <div className="table-scroll-lg">
                            <table className="prod-table">
                                <thead><tr><th>Imagen</th><th>Categoría</th><th>Nombre Platillo</th><th>Descripción</th><th>Estado</th><th>Precio</th><th>Acciones</th></tr></thead>
                                <tbody>
                                {products.map(p => (
                                    <tr key={p.productId}>
                                        <td>
                                            {getProductImage(p)
                                                ? <img src={getProductImage(p)} alt={p.name} className="prod-thumb" />
                                                : <div className="prod-thumb-empty">📷</div>
                                            }
                                        </td>
                                        <td className="cat-highlight">{p.categoryName}</td>
                                        <td className="fw-bold">{p.name}</td>
                                        <td style={{ fontSize: '0.82rem', color: '#666', maxWidth: '180px' }}>
                                            {p.description || <span style={{ color: '#bbb' }}>—</span>}
                                        </td>
                                        <td className={p.status === 1 ? 'text-active' : 'text-inactive'}>{p.status === 1 ? 'ACTIVO' : 'INACTIVO'}</td>
                                        <td>C$ {Number(p.price).toFixed(0)}</td>
                                        <td>
                                            <label className="prod-switch">
                                                <input type="checkbox" checked={p.status === 1} onChange={() => handleToggleStatus(p.productId)} />
                                                <span className="prod-slider"></span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && <tr><td colSpan="7" className="text-center">No hay productos.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="watermark">Platillos</div>
                </div>
            )}

            {/* ══════════════ VISTA ADMIN ══════════════ */}
            {view === 'admin' && (
                <>

                    <div className="prod-admin-grid">

                        {/* ── Panel Categorías ── */}
                        <div className="admin-panel">
                            <div className="admin-header">🗂️ Administrar Categorías</div>
                            <div className="admin-body">
                                <div className="cat-input-row">
                                    <input
                                        type="text"
                                        className={errors.catName ? 'input-error' : ''}
                                        placeholder="Nombre de categoría..."
                                        value={catForm.name}
                                        onChange={e => { setCatForm({ ...catForm, name: e.target.value }); if (errors.catName) setErrors({ ...errors, catName: '' }); }}
                                    />
                                </div>
                                {errors.catName && <span className="error-text" style={{ marginBottom: '8px', display: 'block' }}>{errors.catName}</span>}
                                <div className="cat-action-row">
                                    <button className="btn-save-new" onClick={handleSaveNewCat}>+ Guardar Nuevo</button>
                                    <button className="btn-save-edit" onClick={handleSaveEditCat} disabled={!catForm.id}>✏️ Guardar Cambios</button>
                                </div>

                                <div className="table-scroll">
                                    <table className="admin-table">
                                        <thead>
                                        <tr>
                                            <th style={{ background: '#444' }}>Categoría</th>
                                            <th style={{ background: '#444', width: '72px', textAlign: 'right' }}>Acc.</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {categories.map(c => (
                                            <tr key={c.productCategoryId} className={catForm.id === c.productCategoryId ? 'row-selected' : ''}>
                                                <td className="fw-bold">{c.name}</td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <button className="icon-btn" title="Editar" onClick={() => { setCatForm({ id: c.productCategoryId, name: c.name }); setErrors({}); }}>✏️</button>
                                                        <button className="icon-btn" title="Eliminar" onClick={() => handleDeleteCat(c.productCategoryId)}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ── Panel Platillos ── */}
                        <div className="admin-panel">
                            <div className="admin-header">🍽️ Administrar Platillos y Precios</div>
                            <div className="admin-body">
                                <div className="platillos-layout">

                                    {/* Tabla izquierda */}
                                    <div>
                                        <div className="admin-filters">
                                            <div className="prod-search" style={{ maxWidth: '180px' }}>
                                                <span>🔍</span>
                                                <input type="text" placeholder="Buscar..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                                            </div>
                                            <select className="prod-select" value={adminCatFilter} onChange={e => setAdminCatFilter(e.target.value)}>
                                                <option value="">Categoría</option>
                                                {categories.map(c => <option key={c.productCategoryId} value={c.productCategoryId}>{c.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="table-scroll" style={{ maxHeight: '420px' }}>
                                            <table className="admin-table">
                                                <thead>
                                                <tr>
                                                    <th style={{ background: '#444', width: '44px' }}>Img</th>
                                                    <th style={{ background: '#444' }}>Platillo</th>
                                                    <th style={{ background: '#444' }}>Precio</th>
                                                    <th style={{ background: '#444' }}>Cat.</th>
                                                    <th style={{ background: '#444', width: '72px', textAlign: 'right' }}>Acc.</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {adminFiltered.map(p => (
                                                    <tr key={p.productId} className={prodForm.id === p.productId ? 'row-selected' : ''}>
                                                        <td>
                                                            {getProductImage(p)
                                                                ? <img src={getProductImage(p)} alt={p.name} className="prod-thumb" />
                                                                : <div className="prod-thumb-empty">📷</div>
                                                            }
                                                        </td>
                                                        <td className="fw-bold">{p.name}</td>
                                                        <td style={{ whiteSpace: 'nowrap' }}>C$ {Number(p.price).toFixed(0)}</td>
                                                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{p.categoryName}</td>
                                                        <td>
                                                            <div className="actions-cell">
                                                                <button className="icon-btn" title="Editar" onClick={() => handleEditProd(p)}>✏️</button>
                                                                <button className="icon-btn" title="Eliminar" onClick={() => handleDeleteProd(p.productId)}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {adminFiltered.length === 0 && (
                                                    <tr><td colSpan="5" className="text-center" style={{ padding: '1.5rem' }}>No hay platillos.</td></tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Formulario derecha */}
                                    <div className="prod-form-card">
                                        <div className="prod-form-card-header">
                                            {prodForm.id ? '✏️ Editando platillo' : '➕ Nuevo platillo'}
                                        </div>

                                        <div className="prod-form-card-body">

                                            {/* Zona imagen */}
                                            <div className="prod-image-zone" onClick={() => fileInputRef.current?.click()}>
                                                <div className="prod-image-preview">
                                                    {imagePreview
                                                        ? <img src={imagePreview} alt="preview" />
                                                        : <span className="prod-image-placeholder">📷</span>
                                                    }
                                                </div>
                                                <div className="prod-image-info">
                                                    <strong>{imagePreview ? 'Imagen seleccionada' : 'Sin imagen'}</strong>
                                                    <p>JPG, PNG o WebP · máx 2 MB</p>
                                                </div>
                                                <div className="prod-image-btns" onClick={e => e.stopPropagation()}>
                                                    <button className="btn-img-pick" onClick={() => fileInputRef.current?.click()}>
                                                        {imagePreview ? 'Cambiar' : 'Subir'}
                                                    </button>
                                                    {imagePreview && (
                                                        <button className="btn-img-clear" onClick={clearImage}>✕ Quitar</button>
                                                    )}
                                                </div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleImageChange}
                                                />
                                            </div>

                                            {/* Campos */}
                                            <div className="prod-form-fields">
                                                <div className="prod-form-field">
                                                    <label>Nombre</label>
                                                    <input
                                                        type="text"
                                                        className={`prod-input ${errors.prodName ? 'input-error' : ''}`}
                                                        placeholder="Nombre del platillo"
                                                        value={prodForm.name}
                                                        onChange={e => { setProdForm({ ...prodForm, name: e.target.value }); if (errors.prodName) setErrors({ ...errors, prodName: '' }); }}
                                                    />
                                                    {errors.prodName && <span className="error-text">{errors.prodName}</span>}
                                                </div>

                                                {/* ── Campo descripción ── */}
                                                <div className="prod-form-field">
                                                    <label>Descripción <span style={{ color: '#aaa', fontWeight: 400 }}>(opcional)</span></label>
                                                    <textarea
                                                        className="prod-input"
                                                        placeholder="Ej: Servido con arroz, ensalada y tortillas..."
                                                        value={prodForm.description}
                                                        rows={2}
                                                        onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                                                        style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                                                    />
                                                </div>

                                                <div className="prod-form-row-2">
                                                    <div className="prod-form-field">
                                                        <label>Categoría</label>
                                                        <select
                                                            className={`prod-select ${errors.prodCategory ? 'input-error' : ''}`}
                                                            value={prodForm.productCategoryId}
                                                            onChange={e => { setProdForm({ ...prodForm, productCategoryId: e.target.value }); if (errors.prodCategory) setErrors({ ...errors, prodCategory: '' }); }}
                                                        >
                                                            <option value="">-- Seleccionar --</option>
                                                            {categories.map(c => <option key={c.productCategoryId} value={c.productCategoryId}>{c.name}</option>)}
                                                        </select>
                                                        {errors.prodCategory && <span className="error-text">{errors.prodCategory}</span>}
                                                    </div>
                                                    <div className="prod-form-field">
                                                        <label>Precio (C$)</label>
                                                        <input
                                                            type="number"
                                                            className={`prod-input ${errors.prodPrice ? 'input-error' : ''}`}
                                                            placeholder="0"
                                                            value={prodForm.price}
                                                            onChange={e => { setProdForm({ ...prodForm, price: e.target.value }); if (errors.prodPrice) setErrors({ ...errors, prodPrice: '' }); }}
                                                        />
                                                        {errors.prodPrice && <span className="error-text">{errors.prodPrice}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Botones acción */}
                                            <div className={`form-action-btns ${prodForm.id ? 'with-cancel' : ''}`}>
                                                {prodForm.id && (
                                                    <button className="btn-cancel-form" onClick={resetProdForm}>✕</button>
                                                )}
                                                <button className="btn-save-new" onClick={handleSaveNewProd} disabled={!!prodForm.id}>+ Nuevo</button>
                                                <button className="btn-save-edit" onClick={handleSaveEditProd} disabled={!prodForm.id}>✏️ Guardar</button>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}