import React from "react";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useToast } from "@chakra-ui/react";
import { useState } from "react";
import { UseAuthContext } from "../hooks/useAuthContext";
import Usefetch from "../hooks/useGet";
import "./styles.css";
import { Link } from "react-router-dom";

const AddItem = () => {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const api = `${API_BASE_URL}/ip/cat/allcat`;
  const { data } = Usefetch(api);
  const Category = data?.cats || [];

  const Toast = useToast();
  const { user } = UseAuthContext();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [Item_Name, setItem_Name] = useState("");
  const [Item_Description, setItem_Description] = useState("");
  const [Item_Brand, setItem_Brand] = useState("");
  const [Item_Category, setItem_Category] = useState("");
  const [Item_Price, setItem_Price] = useState("");
  const [Item_poster, setItem_poster] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const token = user?.token;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        Toast({
          title: "Invalid file type",
          description: "Please upload JPG, PNG, GIF, or WebP images",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handle_submit = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      Toast({
        title: "Authentication required",
        description: "Please log in to post items",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (!selectedFile) {
      Toast({
        title: "Image required",
        description: "Please select an image to upload",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (
      !Item_Name ||
      !Item_Description ||
      !Item_Brand ||
      !Item_Price ||
      !Item_Category
    ) {
      Toast({
        title: "Missing information",
        description: "Please fill all required fields",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    setIsLoading(true);
    const userID = user.id;
    setItem_poster(userID);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("Item_Images", selectedFile);
      formData.append("Item_Name", Item_Name);
      formData.append("Item_Description", Item_Description);
      formData.append("Item_Brand", Item_Brand);
      formData.append("Item_Price", Item_Price);
      formData.append("Item_Category", Item_Category);
      formData.append("Item_poster", userID);

      const response = await fetch(`${API_BASE_URL}/ip/item/newitems`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post item");
      }

      Toast({
        title: "Success",
        description: "Item posted successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset form
      setItem_Name("");
      setItem_Description("");
      setItem_Brand("");
      setItem_Price("");
      setItem_Category("");
      setSelectedFile(null);
      setPreviewImage(null);
    } catch (error) {
      console.error("Post error:", error);
      Toast({
        title: "Post failed",
        description: error.message || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container content">
        <form className="form" onSubmit={handle_submit}>
          <p className="title">Post Item</p>
          <p className="message">You Can Add Any Item to Gebeyachn.</p>

          <div className="flex">
            <label>
              <input
                className="input"
                type="text"
                placeholder="Item Name *"
                required
                value={Item_Name}
                onChange={(e) => setItem_Name(e.target.value)}
              />
            </label>

            <label>
              <input
                className="input"
                type="number"
                placeholder="Price *"
                required
                min="0"
                step="0.01"
                value={Item_Price}
                onChange={(e) => setItem_Price(e.target.value)}
              />
            </label>
          </div>

          <label>
            <textarea
              className="input"
              placeholder="Item Description *"
              required
              rows="3"
              value={Item_Description}
              onChange={(e) => setItem_Description(e.target.value)}
            />
          </label>

          <label>
            <input
              className="input"
              type="text"
              placeholder="Item Brand *"
              required
              value={Item_Brand}
              onChange={(e) => setItem_Brand(e.target.value)}
            />
          </label>

          {Category.length > 0 && (
            <div className="input-group mb-3">
              <label className="input-group-text" htmlFor="categorySelect">
                Category *
              </label>
              <select
                className="form-select"
                id="categorySelect"
                required
                value={Item_Category}
                onChange={(e) => setItem_Category(e.target.value)}
              >
                <option value="">Select a category</option>
                {Category.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.catagory_Name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <small className="text-muted">
              Max file size: 5MB. Supported: JPG, PNG, GIF, WebP
            </small>
          </label>

          {previewImage && (
            <div className="preview-container mb-3">
              <p>Image Preview:</p>
              <img
                src={previewImage}
                alt="Preview"
                className="img-thumbnail"
                style={{ maxWidth: "200px", maxHeight: "200px" }}
              />
            </div>
          )}

          <button className="submit" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Posting...
              </>
            ) : (
              "Post Item"
            )}
          </button>

          <p className="signin mt-3">
            <Link to="/" className="btn btn-outline-secondary">
              Go Home
            </Link>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default AddItem;
