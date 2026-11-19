import { useEffect, useState } from "react";
import API from "../services/api";

interface Category {
    category_id: number;
    category_name: string;
    parent_category_id: number | null;
    description: string | null;
    image: string | null;
    is_active: boolean;
}

function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [parentCategoryId, setParentCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    const mainCategories = categories.filter(
        (category) => category.parent_category_id === null
    );

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories");
            setCategories(response.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setMessage("Unable to load categories.");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("category_name", categoryName);
        formData.append(
            "parent_category_id",
            parentCategoryId
        );
        formData.append("description", description);

        if (image) {
            formData.append("image", image);
        }

        try {
            const response = await API.post(
                "/categories",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage(response.data.message);
            setCategoryName("");
            setParentCategoryId("");
            setDescription("");
            setImage(null);

            await fetchCategories();

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to add category."
            );
        }
    };

    return (
        <div className="category-management">
            <h2>Category Management</h2>
            <p>Manage your sweets and snacks categories.</p>

            <form onSubmit={handleSubmit}>
                <h3>Add New Category</h3>

                <label>Category Name</label>
                <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    required
                />

                <label>Main Category</label>
                <select
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                >
                    <option value="">None (Main Category)</option>

                    {mainCategories.map((category) => (
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
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter category description"
                />

                <label>Category Image</label>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                        setImage(e.target.files?.[0] || null)
                    }
                />

                <button type="submit">Add Category</button>
            </form>

            {message && <p>{message}</p>}

            <h3>Existing Categories</h3>

            <div>
                {categories.map((category) => (
                    <div key={category.category_id}>
                        {category.image && (
                            <img
                                src={`http://localhost:5000${category.image}`}
                                alt={category.category_name}
                                width="80"
                            />
                        )}

                        <strong>{category.category_name}</strong>

                        {category.parent_category_id && (
                            <span> (Subcategory)</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryManagement;