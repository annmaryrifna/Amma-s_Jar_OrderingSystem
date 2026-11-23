
import { useEffect, useState } from "react";
import API from "../services/api";
import "./css/ProductManagement.css";

interface Category {
    category_id: number;
    category_name: string;
    parent_category_id: number | null;
}

interface Product {
    product_id: number;
    product_name: string;
    main_category_name: string;
    subcategory_name: string;
    image: string | null;
    price: number;
    price_quantity: number;
    unit: string;
    is_active: boolean;
}

function ProductManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [productName, setProductName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [priceQuantity, setPriceQuantity] = useState("");
    const [unit, setUnit] = useState("pieces");
    const [purchaseOptions, setPurchaseOptions] = useState("");
    const [image, setImage] = useState<File | null>(null);

    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const subcategories = categories.filter(
        category => category.parent_category_id !== null
    );

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories");
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Category loading error:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products");
            setProducts(response.data.products || []);
        } catch (error) {
            console.error("Product loading error:", error);
            setMessage("Unable to load products.");
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (saving) return;

        const quantities = purchaseOptions
            .split(",")
            .map(value => Number(value.trim()));

        if (
            !quantities.length ||
            quantities.some(value => !Number.isFinite(value) || value <= 0)
        ) {
            setMessage("Please enter valid purchase quantities.");
            return;
        }

        const formData = new FormData();

        formData.append("product_name", productName);
        formData.append("category_id", categoryId);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("price_quantity", priceQuantity);
        formData.append("unit", unit);
        formData.append("purchase_options", JSON.stringify(quantities));

        if (image) {
            formData.append("image", image);
        }

        try {
            setSaving(true);
            setMessage("");

            const response = await API.post(
                "/products",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setMessage(response.data.message);

            setProductName("");
            setCategoryId("");
            setDescription("");
            setPrice("");
            setPriceQuantity("");
            setUnit("pieces");
            setPurchaseOptions("");
            setImage(null);

            const fileInput = document.getElementById(
                "product-image"
            ) as HTMLInputElement | null;

            if (fileInput) fileInput.value = "";

            await fetchProducts();

        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to add product."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="product-management">

            {/* PAGE HEADER */}
            <div className="product-page-header">
                <h2>Product Management</h2>
                <p>Add and manage your homemade sweets and snacks.</p>
            </div>

            <div className="product-management-layout">

                {/* LEFT: ADD PRODUCT FORM */}
                <section className="product-form-section">

                    <form onSubmit={handleSubmit}>
                        <h3>Add New Product</h3>

                        <label>Product Name</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={e => setProductName(e.target.value)}
                            placeholder="Example: Laddu"
                            required
                        />

                        <label>Subcategory</label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            required
                        >
                            <option value="">Select Subcategory</option>

                            {subcategories.map(category => (
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
                            placeholder="Describe your product"
                        />

                        <label>Product Image</label>
                        <input
                            id="product-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e =>
                                setImage(e.target.files?.[0] || null)
                            }
                        />

                        <label>Price (₹)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="Enter price"
                            required
                        />

                        <label>Price Quantity</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={priceQuantity}
                            onChange={e => setPriceQuantity(e.target.value)}
                            placeholder="Example: 10"
                            required
                        />

                        <label>Unit</label>
                        <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                        >
                            <option value="pieces">Pieces</option>
                            <option value="grams">Grams</option>
                            <option value="kg">Kilograms</option>
                        </select>

                        <label>Available Purchase Quantities</label>
                        <input
                            type="text"
                            value={purchaseOptions}
                            onChange={e => setPurchaseOptions(e.target.value)}
                            placeholder="Example: 10, 20, 25, 50, 100"
                            required
                        />

                        <button type="submit" disabled={saving}>
                            {saving ? "Adding Product..." : "Add Product"}
                        </button>
                    </form>

                    {message && (
                        <div className="product-message">
                            {message}
                        </div>
                    )}

                </section>

                {/* RIGHT: EXISTING PRODUCTS */}
                <section className="existing-products-section">

                    <div className="existing-products-header">
                        <h3>Existing Products</h3>
                        <span className="product-count">
                            {products.length} Products
                        </span>
                    </div>

                    {products.length === 0 ? (
                        <div className="product-empty">
                            No products available yet.
                        </div>
                    ) : (
                        <div className="product-list">

                            {products.map(product => (
                                <div
                                    className="product-card"
                                    key={product.product_id}
                                >

                                    {product.image ? (
                                        <img
                                            className="product-card-image"
                                            src={`http://localhost:5000${product.image}`}
                                            alt={product.product_name}
                                        />
                                    ) : (
                                        <div className="product-image-placeholder">
                                            No Image
                                        </div>
                                    )}

                                    <div className="product-card-content">

                                        <div className="product-card-title">
                                            <h4>{product.product_name}</h4>

                                            <span className={`product-status ${Number(product.is_active) === 1
                                                    ? "active"
                                                    : "inactive"
                                                }`}>
                                                {Number(product.is_active) === 1
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>

                                        <p className="product-category">
                                            {product.main_category_name} /{" "}
                                            {product.subcategory_name}
                                        </p>

                                        <p className="product-price">
                                            ₹{Number(product.price).toFixed(2)}
                                        </p>

                                        <p className="product-quantity">
                                            Per {product.price_quantity}{" "}
                                            {product.unit}
                                        </p>

                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

                </section>

            </div>
        </div>
    );
}

export default ProductManagement;
