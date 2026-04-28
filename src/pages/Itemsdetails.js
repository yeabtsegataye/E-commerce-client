import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./styles.css";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Avatar, Wrap, WrapItem } from "@chakra-ui/react";
import { UseAuthContext } from "../hooks/useAuthContext";
import { useCart } from "../contexts/CartContext";

function Itemsdetails() {
  const { user } = UseAuthContext();
  const API_BASE_URL = process.env.REACT_APP_URL;
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    Item_Name: "",
    Item_Brand: "",
    Item_Description: "",
    Item_Price: "",
    Item_Status: "",
    Item_Age: "",
    Item_Gender: "unisex",
    Item_Category: "",
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setItems(null);
      setLoadError(null);
      try {
        const headers = {};
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }
        const res = await fetch(`${API_BASE_URL}/ip/item/oneitem/${id}`, {
          headers,
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.message || "Could not load item");
          return;
        }
        setItems(data.all_Items);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Network error");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, id, user?.token]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ip/cat/allcat`);
        if (!res.ok) return;
        const data = await res.json();
        setCategories(data.cats || data);
      } catch {
        // ignore category load failures for view-only mode
      }
    };
    fetchCategories();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!items) return;
    setEditFields({
      Item_Name: items.Item_Name || "",
      Item_Brand: items.Item_Brand || "",
      Item_Description: items.Item_Description || "",
      Item_Price: items.Item_SellingPrice ?? items.Item_Price ?? "",
      Item_Status: items.Item_Status || "available",
      Item_Age: items.Item_Age ?? "",
      Item_Gender: items.Item_Gender || "unisex",
      Item_Category: items.Item_Category?._id || "",
    });
  }, [items]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [location.search]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/ip/item/itemsdelete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: items._id,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Item deleted successfully");
        window.location.href = "/";
      } else {
        alert(result.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong");
    }
  };

  const displayPrice = items?.Item_SellingPrice ?? items?.Item_Price ?? 0;

  const isOwner = user && items && user.id === items.Item_poster?._id;
  const canEdit = user && items && (user.isAdmin || isOwner);

  const stockQty = typeof items?.StockQty === "number" ? items.StockQty : null;
  const inStock = stockQty === null ? null : stockQty > 0;

  const handleAddToCart = () => {
    if (!items) return;
    if (inStock === false) {
      alert("This item is out of stock.");
      return;
    }
    addToCart(items);
    navigate("/cart");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!items || !user?.id) return;

    try {
      const payload = {
        Item_id: items._id,
        user_id: user.id,
        Item_Name: editFields.Item_Name,
        Item_Brand: editFields.Item_Brand,
        Item_Description: editFields.Item_Description,
        Item_Price: editFields.Item_Price,
        Item_Status: editFields.Item_Status,
        Item_Age: editFields.Item_Age,
        Item_Gender: editFields.Item_Gender,
      };

      if (editFields.Item_Category) {
        payload.Item_Category = editFields.Item_Category;
      }

      const res = await fetch(`${API_BASE_URL}/ip/item/itemsedit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }
      setItems(data.item);
      setIsEditing(false);
      alert("Item updated successfully.");
    } catch (err) {
      alert(err.message || "Failed to update item");
    }
  };

  const handleImageClick = () => {
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const ageNum = items != null ? Number(items.Item_Age) : NaN;
  const showAge = Number.isFinite(ageNum) && ageNum > 0;
  const showGender =
    items?.Item_Gender && items.Item_Gender !== "unisex";

  return (
    <div>
      <Navbar />

      <div className="item_content">
        <div className="item_d_grid item-detail-page">
          <div className="item_img_coll">
            {loadError && (
              <div className="item-detail-error">{loadError}</div>
            )}
            {!items && !loadError ? (
              <div className="spinner-border text-warning" role="status" />
            ) : items ? (
              <div className="item-detail-card">
                <div className="item-detail-media">
                  <img
                    src={items.Item_Images}
                    alt={items.Item_Name}
                    onClick={handleImageClick}
                    title="Click to enlarge"
                  />
                </div>

                <div className="item-detail-body">
                  <div className="item-detail-header">
                    <h2 className="item-detail-title">{items.Item_Name}</h2>
                    <div className="item-detail-price">
                      ETB {Number(displayPrice).toLocaleString()}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="item-detail-actions" style={{ marginBottom: 16 }}>
                      {!isEditing ? (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit item
                        </button>
                      ) : (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  )}

                  <div className="item-detail-meta">
                    <span className="item-pill">Brand: {items.Item_Brand}</span>
                    {items.Item_Category?.catagory_Name && (
                      <span className="item-pill">
                        Category: {items.Item_Category.catagory_Name}
                      </span>
                    )}
                    {items.Item_Condition && (
                      <span className="item-pill">Condition: {items.Item_Condition}</span>
                    )}
                    <span className="item-pill">Status: {items.Item_Status || "available"}</span>
                    {inStock !== null && (
                      <span className={`item-pill ${inStock ? "pill-ok" : "pill-warn"}`}>
                        {inStock ? "In stock" : "Out of stock"}
                      </span>
                    )}
                    {showAge && <span className="item-pill">Age: {items.Item_Age}</span>}
                    {showGender && (
                      <span className="item-pill">Gender: {items.Item_Gender}</span>
                    )}
                    {user?.isAdmin && items.Barcode && (
                      <span className="item-pill">Barcode: {items.Barcode}</span>
                    )}
                    {user?.isAdmin && stockQty !== null && (
                      <span className="item-pill">Stock qty: {stockQty}</span>
                    )}
                  </div>

                  {isEditing && (
                    <form className="item-edit-form" onSubmit={handleEditSubmit}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            className="input"
                            value={editFields.Item_Name}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Brand</label>
                          <input
                            className="input"
                            value={editFields.Item_Brand}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Brand: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Description</label>
                          <textarea
                            className="input"
                            rows={4}
                            value={editFields.Item_Description}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Price</label>
                          <input
                            className="input"
                            type="number"
                            value={editFields.Item_Price}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Price: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <input
                            className="input"
                            value={editFields.Item_Status}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Status: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Age</label>
                          <input
                            className="input"
                            type="number"
                            value={editFields.Item_Age}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Age: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Gender</label>
                          <select
                            className="input"
                            value={editFields.Item_Gender}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Gender: e.target.value,
                              }))
                            }
                          >
                            <option value="unisex">Unisex</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Category</label>
                          <select
                            className="input"
                            value={editFields.Item_Category}
                            onChange={(e) =>
                              setEditFields((prev) => ({
                                ...prev,
                                Item_Category: e.target.value,
                              }))
                            }
                          >
                            <option value="">Keep current category</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.catagory_Name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="item-edit-form-actions">
                        <button className="btn-primary" type="submit">
                          Save changes
                        </button>
                      </div>
                    </form>
                  )}

                  <p className="item-detail-description">{items.Item_Description}</p>

                  {user?.isAdmin &&
                    typeof items.Item_BoughtPrice === "number" && (
                      <div className="item-admin-cost">
                        <span className="item-admin-cost-label">
                          Cost (buy) — admin only
                        </span>
                        <span className="item-admin-cost-value">
                          ETB{" "}
                          {Number(items.Item_BoughtPrice).toLocaleString()}
                        </span>
                      </div>
                    )}

                  <div className="item-detail-actions">
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={handleAddToCart}
                      disabled={inStock === false}
                    >
                      {inStock === false ? "Out of stock" : "Add to cart"}
                    </button>
                    <Link className="btn-secondary" to="/cart">
                      View cart
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="item_poster_coll">
            {items && (
              <>
                {items.Item_poster?.Address && (
                  <div className="item-detail-seller-card">
                    <h4 className="item-detail-seller-heading">Pickup area</h4>
                    <p className="item-detail-address">
                      {items.Item_poster.Address}
                    </p>
                  </div>
                )}

                <div className="user">
                  <div className="pp">
                    <Wrap>
                      <WrapItem>
                        <Avatar
                          size="md"
                          name={items.Item_poster?.Name}
                          src={items.Item_poster?.pic}
                        />
                      </WrapItem>
                    </Wrap>
                    <h4>{items.Item_poster?.Name}</h4>
                  </div>

                  <hr />

                  {items.Item_poster?.Phone && (
                    <a className="p" href={`tel:${items.Item_poster.Phone}`}>
                      <i className="fa-solid fa-phone">
                        <span> </span>
                        Call: {items.Item_poster.Phone}
                      </i>
                    </a>
                  )}
                </div>

                <div className="sefty">
                  <h4>Safety tips</h4>
                  <ul>
                    <li>Don't pay in advance</li>
                    <li>Meet in a public place</li>
                    <li>Inspect before paying</li>
                    <li>Pay only when satisfied</li>
                  </ul>
                </div>

                {isOwner && (
                  <div className="report">
                    <button className="delete-item-btn" type="button" onClick={handleDelete}>
                      Delete item
                    </button>
                  </div>
                )}
                {isPreviewOpen && (
                  <div className="image-preview-modal" onClick={closePreview}>
                    <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
                      <button className="close-preview-btn" type="button" onClick={closePreview}>
                        ×
                      </button>
                      <img src={items.Item_Images} alt={items.Item_Name} />
                    </div>
                  </div>
                )}

                {!isOwner && (
                  <div className="report">
                    <a
                      className="report-link"
                      href={`mailto:support@example.com?subject=${encodeURIComponent(
                        `Report item: ${items.Item_Name}`
                      )}&body=${encodeURIComponent(
                        `Item id: ${items._id}\nSeller: ${items.Item_poster?.Name || "-"}\n\nDescribe the issue:`
                      )}`}
                    >
                      Report issue
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Itemsdetails;
