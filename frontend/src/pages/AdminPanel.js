// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminPanel.css';

// ✅ Helper: Returns correct image URL (Cloudinary or local fallback)
const getImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image; // Cloudinary URL
  return `http://localhost:5000/${image.replace(/^\/?/, '')}`; // Old local fallback
};

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    category: 'Stationary',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // ✅ Category management state
  const [categories, setCategories] = useState(['Stationary', 'Snacks', 'Electronics', 'Clothing', 'Books']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // ✅ Check if user is admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      toast.error('Access denied! Admin only.');
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchProducts();
      loadCategories();
    }
  }, [user]);

  // ✅ Load categories from localStorage
  const loadCategories = () => {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  };

  // ✅ Save categories to localStorage
  const saveCategories = (newCategories) => {
    localStorage.setItem('productCategories', JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  // ✅ Add new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      toast.error('Category already exists');
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    saveCategories(updatedCategories);
    toast.success('Category added successfully!');
    setNewCategory('');
    setShowAddCategory(false);
  };

  // ✅ Delete category
  const handleDeleteCategory = (categoryToDelete) => {
    if (categories.length <= 1) {
      toast.error('At least one category is required');
      return;
    }

    const productsInCategory = products.filter(p => p.category === categoryToDelete);
    if (productsInCategory.length > 0) {
      toast.error(`Cannot delete. ${productsInCategory.length} product(s) use this category`);
      return;
    }

    if (window.confirm(`Delete category "${categoryToDelete}"?`)) {
      const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
      saveCategories(updatedCategories);
      toast.success('Category deleted successfully!');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, GIF, WEBP)');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!editMode && !formData.image) {
      toast.error('Please upload a product image');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('discount', formData.discount || 0);
    data.append('category', formData.category);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      const url = editMode
        ? `http://localhost:5000/api/admin/products/${currentProduct._id}`
        : 'http://localhost:5000/api/admin/products';

      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: data
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editMode ? 'Product updated successfully!' : 'Product added successfully!');
        fetchProducts();
        closeModal();
      } else {
        toast.error(result.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      discount: product.discount || '',
      category: product.category,
      image: null
    });
    // ✅ Use helper to get correct preview URL
    setImagePreview(getImageUrl(product.image));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Product deleted successfully!');
        fetchProducts();
      } else {
        toast.error(result.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentProduct(null);
    setFormData({
      name: '',
      price: '',
      discount: '',
      category: categories[0] || 'Stationary',
      image: null
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentProduct(null);
    setFormData({
      name: '',
      price: '',
      discount: '',
      category: categories[0] || 'Stationary',
      image: null
    });
    setImagePreview(null);
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Product Management</h1>
        <div className="header-actions">
          <button className="btn-category" onClick={() => setShowAddCategory(!showAddCategory)}>
            📁 Manage Categories
          </button>
          <button className="btn-add" onClick={openAddModal}>
            + Add New Product
          </button>
        </div>
      </div>

      {/* ✅ Category Management Section */}
      {showAddCategory && (
        <div className="category-manager">
          <h3>Category Management</h3>
          <div className="add-category-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="btn-add-cat">
              Add Category
            </button>
          </div>
          <div className="category-list">
            {categories.map(cat => (
              <div key={cat} className="category-item">
                <span>{cat}</span>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="btn-delete-cat"
                  title="Delete category"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="products-grid">
        {products.length === 0 ? (
          <p className="no-products">No products available. Add your first product!</p>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              {/* ✅ Use helper to handle both Cloudinary and local images */}
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="100" dx="50"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="category">{product.category}</p>
                <p className="price">₹{product.price}</p>
                {product.discount > 0 && (
                  <p className="discount">Save ₹{product.discount}</p>
                )}
              </div>
              <div className="product-actions">
                <button className="btn-edit" onClick={() => handleEdit(product)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn-close" onClick={closeModal}>×</button>
            </div>

            <div className="product-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Discount (₹)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Product Image {!editMode && '*'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small className="file-info">Max size: 5MB. Formats: JPG, PNG, GIF, WEBP</small>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editMode ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}