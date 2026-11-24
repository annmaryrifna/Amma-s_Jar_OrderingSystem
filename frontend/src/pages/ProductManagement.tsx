
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
    category_id: number;
    description: string | null;
    purchase_options: number[] | string | null;
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
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const subcategories = categories.filter(
        category => category.parent_category_id !== null
    );

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories/admin/all");
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Category loading error:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products/admin/all");
            setProducts(response.data.products || []);
        } catch (error) {
            console.error("Product loading error:", error);
            setMessage("Unable to load products.");
        }
    };
    const handleEditProduct = (product: Product) => {
        setEditingProductId(product.product_id);
        setProductName(product.product_name);
        setCategoryId(String(product.category_id));
        setDescription(product.description || "");
        setPrice(String(product.price));
        setPriceQuantity(String(product.price_quantity));
        setUnit(product.unit);
        let options: number[] = [];

        try {
            if (Array.isArray(product.purchase_options)) {
                options = product.purchase_options;
            } else if (typeof product.purchase_options === "string") {
                options = JSON.parse(product.purchase_options);
            }
        } catch (error) {
            console.error("Unable to parse purchase options:", error);
        }

        setPurchaseOptions(options.join(", "));
        setImage(null);
        setMessage("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const handleProductStatus = async (product: Product) => {
        const isActive = Number(product.is_active) === 1;
        const newStatus = !isActive;

        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${product.product_name}?`
        );

        if (!confirmed) return;

        try {
            await API.patch(
                `/products/${product.product_id}/status`,
                { is_active: newStatus }
            );

            setMessage(
                `Product ${newStatus ? "activated" : "deactivated"} successfully.`
            );

            await fetchProducts();
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update product status."
            );
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

            const response = editingProductId !== null
                ? await API.put(
                    `/products/${editingProductId}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                )
                : await API.post(
                    "/products",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );

            setMessage(response.data.message);
            setEditingProductId(null);
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
                        <h3>
                            {editingProductId !== null ? "Edit Product" : "Add New Product"}
                        </h3>

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
                            {saving
                                ? "Saving..."
                                : editingProductId !== null
                                    ? "Save Changes"
                                    : "Add Product"}
                        </button>
                        {editingProductId !== null && (
                            <button
                                type="button" className="cancel-product-button"
                                onClick={() => {
                                    setEditingProductId(null);
                                    setProductName("");
                                    setCategoryId("");
                                    setDescription("");
                                    setPrice("");
                                    setPriceQuantity("");
                                    setUnit("pieces");
                                    setPurchaseOptions("");
                                    setImage(null);
                                    setMessage("");
                                }}
                            >
                                Cancel
                            </button>
                        )}
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

                    {categories
                        .filter(category => category.parent_category_id === null)
                        .map(mainCategory => {
                            const childCategories = categories.filter(
                                category =>
                                    category.parent_category_id === mainCategory.category_id
                            );

                            return (
                                <div
                                    className="product-main-category"
                                    key={mainCategory.category_id}
                                >
                                    <h3 className="product-main-heading">
                                        {mainCategory.category_name}
                                    </h3>

                                    {childCategories.map(subcategory => {
                                        const categoryProducts = products.filter(
                                            product =>
                                                Number(product.category_id) ===
                                                Number(subcategory.category_id)
                                        );

                                        if (categoryProducts.length === 0) return null;

                                        return (
                                            <div
                                                className="product-subcategory-section"
                                                key={subcategory.category_id}
                                            >
                                                <h4 className="product-subcategory-heading">
                                                    {subcategory.category_name}
                                                    <span>
                                                        {categoryProducts.length} products
                                                    </span>
                                                </h4>

                                                <div className="product-list">

                                                    {categoryProducts.map(product => (
                                                        <div
                                                            className="product-card"
                                                            key={product.product_id}
                                                            onClick={() => handleEditProduct(product)}
                                                            title="Click to edit this product"
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

                                                                <div className="product-card-title-row">
                                                                    <h4>{product.product_name}</h4>

                                                                    <button
                                                                        type="button"
                                                                        className={`product-status-button ${Number(product.is_active) === 1 ? "active" : "inactive"
                                                                            }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleProductStatus(product);
                                                                        }}
                                                                    >
                                                                        {Number(product.is_active) === 1 ? "Active" : "Inactive"}
                                                                    </button>
                                                                </div>
                                                                <p className="product-price">
                                                                    ₹{Number(product.price).toFixed(2)}
                                                                </p>

                                                                <p className="product-quantity">
                                                                    Per {product.price_quantity} {product.unit}
                                                                </p>

                                                               

                                                                

                                                            </div>
                                                        </div>
                                                    ))}

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                    {products.length === 0 && (
                        <div className="product-empty">
                            No products available yet.
                        </div>
                    )}

                </section>


            </div>
        </div>
    );
}

export default ProductManagement;
