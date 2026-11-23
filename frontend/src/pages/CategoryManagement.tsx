
import { useEffect, useState } from "react";
import API from "../services/api";
import "./css/CategoryManagement.css";

interface Category {
    category_id: number;
    category_name: string;
    parent_category_id: number | null;
    description: string | null;
    image: string | null;
    is_active: boolean | number;
}

function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [parentCategoryId, setParentCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const mainCategories = categories.filter(
        category => category.parent_category_id === null
    );

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories/admin/all");
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setMessage("Unable to load categories.");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setCategoryName("");
        setParentCategoryId("");
        setDescription("");
        setImage(null);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (saving) return;

        const formData = new FormData();
        formData.append("category_name", categoryName);
        formData.append("parent_category_id", parentCategoryId);
        formData.append("description", description);

        if (image) {
            formData.append("image", image);
        }

        try {
            setSaving(true);

            if (editingId !== null) {
                await API.put(`/categories/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setMessage("Category updated successfully.");
            } else {
                await API.post("/categories", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setMessage("Category added successfully.");
            }

            resetForm();
            await fetchCategories();

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to save category."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.category_id);
        setCategoryName(category.category_name);
        setParentCategoryId(
            category.parent_category_id
                ? String(category.parent_category_id)
                : ""
        );
        setDescription(category.description || "");
        setImage(null);
        setMessage("");
    };

    const handleStatusChange = async (category: Category) => {
        const isActive = Number(category.is_active) === 1;

        const confirmed = window.confirm(
            `Are you sure you want to ${isActive ? "deactivate" : "activate"} "${category.category_name}"?`
        );

        if (!confirmed) return;

        try {
            const newStatus = !isActive;

            await API.patch(
                `/categories/${category.category_id}/status`,
                { is_active: newStatus }
            );

            setMessage(
                `Category ${newStatus ? "activated" : "deactivated"} successfully.`
            );

            await fetchCategories();

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update category status."
            );
        }
    };

    const handleDelete = async (category: Category) => {
        const confirmed = window.confirm(
            `Permanently remove "${category.category_name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await API.delete(`/categories/${category.category_id}`);

            setMessage("Category removed successfully.");

            if (editingId === category.category_id) {
                resetForm();
            }

            await fetchCategories();

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to remove category."
            );
        }
    };

    const getSubcategories = (parentId: number) =>
        categories.filter(
            category => category.parent_category_id === parentId
        );

    const filteredMainCategories = mainCategories.filter(category => {
        const query = search.toLowerCase();

        const matchesMain =
            category.category_name.toLowerCase().includes(query);

        const matchesChild = getSubcategories(category.category_id).some(
            child => child.category_name.toLowerCase().includes(query)
        );

        return matchesMain || matchesChild;
    });

    const renderCategoryActions = (category: Category) => {
        const active = Number(category.is_active) === 1;

        return (
            <div className="category-actions">
                <button
                    type="button"
                    className="category-edit-btn"
                    onClick={() => handleEdit(category)}
                >
                    Edit
                </button>

                <button
                    type="button"
                    className={active ? "category-deactivate-btn" : "category-activate-btn"}
                    onClick={() => handleStatusChange(category)}
                >
                    {active ? "Deactivate" : "Activate"}
                </button>

                <button
                    type="button"
                    className="category-remove-btn"
                    onClick={() => handleDelete(category)}
                >
                    Remove
                </button>
            </div>
        );
    };

    return (
        <div className="category-management">
            <div className="category-page-header">
                <div>
                    <h2>Category Management</h2>
                    <p>Organize and manage your sweets and snacks categories.</p>
                </div>

                <div className="category-count">
                    {categories.length} Categories
                </div>
            </div>

            <div className="category-management-layout">

                {/* LEFT: ADD / EDIT FORM */}
                <section className="category-form-section">
                    <form onSubmit={handleSubmit}>
                        <h3>
                            {editingId !== null ? "Edit Category" : "Add New Category"}
                        </h3>

                        <label>Category Name</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={e => setCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            required
                        />

                        <label>Main Category</label>
                        <select
                            value={parentCategoryId}
                            onChange={e => setParentCategoryId(e.target.value)}
                        >
                            <option value="">None (Main Category)</option>

                            {mainCategories
                                .filter(category => category.category_id !== editingId)
                                .map(category => (
                                    <option
                                        key={category.category_id}
                                        value={category.category_id}
                                    >
                                        {category.category_name}
                                    </option>
                                ))}
                        </select>

                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Enter category description"
                        />

                        <label>Category Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => setImage(e.target.files?.[0] || null)}
                        />

                        <div className="category-form-actions">
                            <button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Save Changes"
                                        : "Add Category"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    className="category-cancel-btn"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {message && (
                        <div className="category-message">
                            {message}
                        </div>
                    )}
                </section>

                {/* RIGHT: EXISTING CATEGORIES */}
                <section className="existing-categories-section">
                    <div className="existing-categories-header">
                        <h3>Existing Categories</h3>

                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="main-category-list">
                        {filteredMainCategories.length === 0 ? (
                            <p className="category-empty">
                                No categories found.
                            </p>
                        ) : (
                            filteredMainCategories.map(main => {
                                const subcategories = getSubcategories(
                                    main.category_id
                                ).filter(child =>
                                    child.category_name.toLowerCase().includes(search.toLowerCase()) ||
                                    main.category_name.toLowerCase().includes(search.toLowerCase())
                                );

                                return (
                                    <div
                                        className="main-category-card"
                                        key={main.category_id}
                                    >
                                        <div className="main-category-details">
                                            {main.image && (
                                                <img
                                                    src={`http://localhost:5000${main.image}`}
                                                    alt={main.category_name}
                                                />
                                            )}

                                            <div className="category-info">
                                                <h4>{main.category_name}</h4>
                                                <span className={`category-status ${Number(main.is_active) === 1 ? "active" : "inactive"}`}>
                                                    {Number(main.is_active) === 1 ? "Active" : "Inactive"}
                                                </span>
                                                {main.description && (
                                                    <p>{main.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {renderCategoryActions(main)}

                                        <div className="subcategory-section">
                                            <h5>Subcategories</h5>

                                            {subcategories.length === 0 ? (
                                                <p className="no-subcategories">
                                                    No subcategories
                                                </p>
                                            ) : (
                                                subcategories.map(child => (
                                                    <div
                                                        className="subcategory-card"
                                                        key={child.category_id}
                                                    >
                                                        <div className="subcategory-details">
                                                            {child.image && (
                                                                <img
                                                                    src={`http://localhost:5000${child.image}`}
                                                                    alt={child.category_name}
                                                                />
                                                            )}

                                                            <div>
                                                                <strong>{child.category_name}</strong>
                                                                <span className={`category-status ${Number(child.is_active) === 1 ? "active" : "inactive"}`}>
                                                                    {Number(child.is_active) === 1 ? "Active" : "Inactive"}
                                                                </span>
                                                                {child.description && (
                                                                    <p>{child.description}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {renderCategoryActions(child)}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default CategoryManagement;
