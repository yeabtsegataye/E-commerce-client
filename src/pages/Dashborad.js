import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./admin.css";
import "../pages/login.css";
import { useToast } from "@chakra-ui/react";
import { UseAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const Toast = useToast();
  const { user } = UseAuthContext();
  const navigate = useNavigate();

  // State for current view
  const [currentView, setCurrentView] = useState("dashboard");

  // Category states
  const [categories, setCategories] = useState([]);
  const [catagory_Name, setcatagory_Name] = useState("");
  const [cat_description, setcat_description] = useState("");
  const [pic, setPic] = useState(null);
  const [PicLoading, setPicLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // User states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  // In your Dashboard component, add these states after other states
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    Name: "",
    Email: "",
    password: "",
    Phone: "",
    Address: "",
    isAdmin: false,
    IsBan: false,
    pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  });
  const [userPic, setUserPic] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalItems: 0,
    categoryStats: [],
    recentActivity: {
      newUsers: 0,
      newItems: 0,
    },
  });

  // Loading states
  const [loading, setLoading] = useState({
    analytics: false,
    users: false,
    categories: false,
  });

  // Check admin access
  useEffect(() => {
    fetchCategories()
    if (!user?.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // Add a loading spinner component for better UX
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
  // Add an empty state component
  const EmptyState = ({ icon, message }) => (
    <div className="empty-state">
      <i className={`fas fa-${icon}`}></i>
      <p>{message}</p>
    </div>
  );
  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading((prev) => ({ ...prev, analytics: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      Toast({
        title: "Error fetching analytics",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("Fetch Users Response Status:", response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Fetch Users Error Response:", errorText); // Debug log
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched Users Data:", data); // Debug log
      setUsers(data);
    } catch (error) {
      console.error("Fetch Users Error:", error); // Debug log
      Toast({
        title: "Error fetching users",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };
  // Add this function in your Dashboard component, after other handler functions
  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !newUser.Name ||
      !newUser.Email ||
      !newUser.password ||
      !newUser.Phone ||
      !newUser.Address
    ) {
      Toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.Email)) {
      Toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    setCreatingUser(true);

    try {
      // Prepare user data
      const userData = {
        ...newUser,
        Phone: Number(newUser.Phone),
        isAdmin: newUser.isAdmin || false,
        IsBan: newUser.IsBan || false,
      };

      // If there's a new picture, upload it first
      if (userPic) {
        const uploadUrl =
          "https://api.cloudinary.com/v1_1/yeabtsega/image/upload";
        const data = new FormData();
        data.append("file", userPic);
        data.append("upload_preset", "chat_app");
        data.append("cloud_name", "yeabtsega");

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: data,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          userData.pic = uploadResult.secure_url;
        }
      }

      // Create user
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      Toast({
        title: "User created successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset form
      setNewUser({
        Name: "",
        Email: "",
        password: "",
        Phone: "",
        Address: "",
        isAdmin: false,
        IsBan: false,
        pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      });
      setUserPic(null);
      setShowAddUserForm(false);

      // Refresh users list
      fetchUsers();
    } catch (error) {
      Toast({
        title: "Error creating user",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setCreatingUser(false);
    }
  };
  // Fetch categories
  const fetchCategories = async () => {
    setLoading((prev) => ({ ...prev, categories: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/ip/cat/allcat`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setCategories(data.cats || data);
    } catch (error) {
      Toast({
        title: "Error fetching categories",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  // Load data based on current view
  useEffect(() => {
    if (!user?.isAdmin || !user?.token) return;

    const loadData = async () => {
      switch (currentView) {
        case "dashboard":
          await fetchAnalytics();
          break;
        case "manageCategories":
          await fetchCategories();
          break;
        case "manageUsers":
          await fetchUsers();
          break;
        case "analytics":
          await fetchAnalytics();
          break;
        default:
          break;
      }
    };

    loadData();
  }, [currentView, user?.isAdmin, user?.token]);

  // Handle image upload
  const handle_upload = async (pic) => {
    const uploadUrl = "https://api.cloudinary.com/v1_1/yeabtsega/image/upload";
    setPicLoading(true);

    if (pic.type === "image/jpeg" || pic.type === "image/png") {
      const data = new FormData();
      data.append("file", pic);
      data.append("upload_preset", "chat_app");
      data.append("cloud_name", "yeabtsega");

      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: data,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const result = await response.json();
        setPic(result.secure_url);
      } catch (err) {
        Toast({
          title: "Upload failed",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } finally {
        setPicLoading(false);
      }
    } else {
      Toast({
        title: "Invalid image type",
        description: "Only JPEG and PNG images are supported",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

  // Handle category submission (create/update)
  const handle_submit = async (e) => {
    e.preventDefault();
    const cat_pic = pic;

    if (!catagory_Name || !cat_description || !cat_pic) {
      Toast({
        title: "Missing fields",
        description: "Please fill all the fields",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      let url, method;

      if (editingCategory) {
        // Update existing category
        url = `${API_BASE_URL}/api/admin/categories/${editingCategory._id}`;
        method = "PUT";
      } else {
        // Create new category
        url = `${API_BASE_URL}/api/admin/categories`;
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          catagory_Name,
          cat_description,
          cat_pic: cat_pic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save category");
      }

      Toast({
        title: `Category ${editingCategory ? "updated" : "added"} successfully`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset form
      setcatagory_Name("");
      setcat_description("");
      setPic(null);
      setEditingCategory(null);

      // Refresh categories
      await fetchCategories();

      // Switch to manage categories view
      setCurrentView("manageCategories");
    } catch (error) {
      Toast({
        title: "Error saving category",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Handle category edit
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setcatagory_Name(category.catagory_Name);
    setcat_description(category.cat_description);
    setPic(category.cat_pic);
    setCurrentView("addCategory");
  };

  // Handle category delete
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete category");
      }

      Toast({
        title: "Category deleted successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      fetchCategories();
    } catch (error) {
      Toast({
        title: "Error deleting category",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Handle user role update
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }

      Toast({
        title: "User role updated successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      fetchUsers();
    } catch (error) {
      Toast({
        title: "Error updating user role",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Handle user ban/unban
  const handleToggleUserBan = async (userId, isCurrentlyBanned) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}/ban`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ isBanned: !isCurrentlyBanned }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user status");
      }

      Toast({
        title: `User ${
          !isCurrentlyBanned ? "banned" : "unbanned"
        } successfully`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      fetchUsers();
    } catch (error) {
      Toast({
        title: "Error updating user status",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return renderDashboard();
      case "addCategory":
        return renderAddCategory();
      case "manageCategories":
        return renderManageCategories();
      case "manageUsers":
        return renderManageUsers();
      // case "analytics":
      //   return renderAnalytics();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-number">{analytics.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-boxes"></i>
          </div>
          <div className="stat-info">
            <h3>Total Items</h3>
            <p className="stat-number">{analytics.totalItems}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-list-alt"></i>
          </div>
          <div className="stat-info">
            <h3>Categories</h3>
            <p className="stat-number">{categories.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-info">
            <h3>Recent Users (7d)</h3>
            <p className="stat-number">
              {analytics.recentActivity?.newUsers || 0}
            </p>
          </div>
        </div>
      </div>
    <div className="analytics-dashboard">
      {/* <h2>Analytics Dashboard</h2> */}

      {loading.analytics ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <h3>Items per Category</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="items"
                      fill="#8884d8"
                      name="Number of Items"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-stat-card">
              <h3>Category Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.items}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="items"
                    >
                      {analytics.categoryStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#8884d8",
                              "#82ca9d",
                              "#ffc658",
                              "#ff8042",
                              "#0088fe",
                              "#00c49f",
                              "#ffbb28",
                              "#ff8042",
                            ][index % 8]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="category-list-analytics">
            <h3>Category Details</h3>
            <div className="category-items-list">
              {analytics.categoryStats.map((category) => (
                <div key={category.categoryId} className="category-item">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.items} items</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  
    </div>
  );

  const renderAddCategory = () => (
    <div className="admin-add-cat-container">
      {/* <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2> */}
      <form className="admin-add-cat-form admin-add-cat-form-grid" onSubmit={handle_submit}>
        <div className="admin-add-cat-left">
          <div className="form-group">
            <label htmlFor="categoryName">Category Name</label>
            <input
              id="categoryName"
              className="input"
              type="text"
              placeholder="Enter category name"
              required
              value={catagory_Name}
              onChange={(e) => setcatagory_Name(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoryDescription">Description</label>
            <textarea
              id="categoryDescription"
              className="input"
              placeholder="Write a concise description (max 250 chars)"
              required
              value={cat_description}
              onChange={(e) => setcat_description(e.target.value)}
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Category Image</label>
            <div className="admin-add-cat-file-wrapper">
              <input
                id="categoryImage"
                className="admin-add-cat-input-file"
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => handle_upload(e.target.files[0])}
              />
              <label htmlFor="categoryImage" className="admin-add-cat-file-label">
                <i className="fas fa-upload"></i> Choose Image
              </label>
              <small className="admin-add-cat-note">JPEG or PNG recommended — keep file size under 2MB.</small>
            </div>
          </div>

          <div className="admin-add-cat-form-buttons">
            {!PicLoading ? (
              <>
                <button className="admin-add-cat-submit primary" type="submit">
                  <i className={`fas fa-${editingCategory ? "save" : "plus"}`}></i>
                  {editingCategory ? "Update Category" : "Add Category"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditingCategory(null);
                    setcatagory_Name("");
                    setcat_description("");
                    setPic(null);
                    setCurrentView("manageCategories");
                  }}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
              </>
            ) : (
              <button className="admin-add-cat-submit" disabled type="button">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Uploading...</span>
                </div>
                Uploading...
              </button>
            )}
          </div>
        </div>

        <div className="form-right">
          <div className="admin-add-cat-preview-card">
            {pic ? (
              <div style={{ width: '100%' }}>
                <img src={pic} alt="Preview" />
                <div className="admin-add-cat-preview-actions">
                  <button type="button" className="admin-add-cat-remove-btn" onClick={() => setPic(null)}>
                    <i className="fas fa-trash"></i> Remove
                  </button>
                  <a className="admin-add-cat-view-btn" href={pic} target="_blank" rel="noreferrer">
                    <i className="fas fa-external-link-alt"></i> View
                  </a>
                </div>
              </div>
            ) : (
              <div className="admin-add-cat-placeholder">
                <i className="fas fa-image fa-3x"></i>
                <p>No image uploaded yet</p>
                <small className="admin-add-cat-note">Preview will appear here when you choose an image.</small>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  const renderManageCategories = () => (
    <div className="manage-categories">
      <div className="section-header">
        <h2>Manage Categories</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setcatagory_Name("");
            setcat_description("");
            setPic(null);
            setCurrentView("addCategory");
          }}
          className="add-new-btn"
        >
          <i className="fas fa-plus"></i> Add New Category
        </button>
      </div>

      {loading.categories ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="folder-open"
          message="No categories found. Add your first category!"
        />
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category._id} className="category-card">
              <div className="category-image">
                <img src={category.cat_pic} alt={category.catagory_Name} />
              </div>
              <div className="category-info">
                <h3>{category.catagory_Name}</h3>
                <p>{category.cat_description}</p>
                <div className="category-actions">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="edit-btn"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id)}
                    className="delete-btn"
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const renderManageUsers = () => (
    <div className="manage-users">
      <div className="section-header">
        <h2>Manage Users</h2>
        <div className="header-actions">
          <button
            onClick={() => fetchUsers()}
            className="refresh-btn"
            title="Refresh Users"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          <button
            onClick={() => setShowAddUserForm(true)}
            className="add-new-btn"
          >
            <i className="fas fa-user-plus"></i> Add New User
          </button>
        </div>
      </div>

      {/* Add User Form Modal */}
      {showAddUserForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddUserForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="userName">Full Name *</label>
                  <input
                    id="userName"
                    className="input"
                    type="text"
                    placeholder="Enter full name"
                    required
                    value={newUser.Name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, Name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userEmail">Email *</label>
                  <input
                    id="userEmail"
                    className="input"
                    type="email"
                    placeholder="Enter email address"
                    required
                    value={newUser.Email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, Email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="userPassword">Password *</label>
                  <input
                    id="userPassword"
                    className="input"
                    type="password"
                    placeholder="Enter password"
                    required
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userPhone">Phone Number *</label>
                  <input
                    id="userPhone"
                    className="input"
                    type="tel"
                    placeholder="Enter phone number"
                    required
                    value={newUser.Phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, Phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="userAddress">Address *</label>
                <textarea
                  id="userAddress"
                  className="input"
                  placeholder="Enter full address"
                  required
                  value={newUser.Address}
                  onChange={(e) =>
                    setNewUser({ ...newUser, Address: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="userPhoto">Profile Photo</label>
                  <input
                    id="userPhoto"
                    className="input"
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={(e) => setUserPic(e.target.files[0])}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <div className="checkbox-item">
                    <input
                      id="isAdmin"
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) =>
                        setNewUser({ ...newUser, isAdmin: e.target.checked })
                      }
                    />
                    <label htmlFor="isAdmin">Make Admin</label>
                  </div>

                  <div className="checkbox-item">
                    <input
                      id="isBanned"
                      type="checkbox"
                      checked={newUser.IsBan}
                      onChange={(e) =>
                        setNewUser({ ...newUser, IsBan: e.target.checked })
                      }
                    />
                    <label htmlFor="isBanned">Ban User</label>
                  </div>
                </div>
              </div>

              {userPic && (
                <div className="image-preview">
                  <img src={URL.createObjectURL(userPic)} alt="User preview" />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddUserForm(false);
                    setNewUser({
                      Name: "",
                      Email: "",
                      password: "",
                      Phone: "",
                      Address: "",
                      isAdmin: false,
                      IsBan: false,
                      pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
                    });
                    setUserPic(null);
                  }}
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit"
                  disabled={creatingUser}
                >
                  {creatingUser ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i> Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USERS TABLE - This was missing! */}
      {loading.users ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon="users"
          message="No users found. Add your first user!"
        />
      ) : (
        <div className="users-table-container">
          <div className="table-info">
            <span>Showing {users.length} users</span>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem._id || userItem.id}>
                  <td>
                    <div className="user-info-cell">
                      <img
                        src={userItem.pic}
                        alt={userItem.Name}
                        className="user-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";
                        }}
                      />
                      <span>{userItem.Name || "No Name"}</span>
                    </div>
                  </td>
                  <td>{userItem.Email || "No Email"}</td>
                  <td>
                    <select
                      value={userItem.isAdmin ? "admin" : "user"}
                      onChange={(e) =>
                        handleUpdateUserRole(userItem._id, e.target.value)
                      }
                      className="role-select"
                      disabled={userItem._id === user?.id}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        userItem.IsBan ? "banned" : "active"
                      }`}
                    >
                      {userItem.IsBan ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td>
                    {userItem.createdAt
                      ? new Date(userItem.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() =>
                          handleToggleUserBan(userItem._id, userItem.IsBan)
                        }
                        className={`ban-btn ${userItem.IsBan ? "unban" : ""}`}
                        disabled={userItem._id === user?.id}
                      >
                        {userItem.IsBan ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="admin-container">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="sidebar-header">
            <h3>
             
            </h3>
          </div>
          <ul className="sidebar-menu">
            <li
              className={currentView === "dashboard" ? "active" : ""}
              onClick={() => setCurrentView("dashboard")}
            >
              <i className="fas fa-tachometer-alt"></i> Dashboard
            </li>
            <li
              className={currentView === "addCategory" ? "active" : ""}
              onClick={() => setCurrentView("addCategory")}
            >
              <i className="fas fa-plus-circle"></i> Add Category
            </li>
            <li
              className={currentView === "manageCategories" ? "active" : ""}
              onClick={() => setCurrentView("manageCategories")}
            >
              <i className="fas fa-list-alt"></i> Manage Categories
            </li>
            <li
              className={currentView === "manageUsers" ? "active" : ""}
              onClick={() => setCurrentView("manageUsers")}
            >
              <i className="fas fa-users-cog"></i> Manage Users
            </li>
            <li
              className={currentView === "addUser" ? "active" : ""}
              onClick={() => {
                setCurrentView("manageUsers");
                // Show the add user form when clicking from sidebar
                setTimeout(() => setShowAddUserForm(true), 100);
              }}
            >
              <i className="fas fa-user-plus"></i> Add User
            </li>
          </ul>

          <div className="sidebar-footer">
            <p>
              Logged in as: <strong>{user?.Name}</strong>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main-content">
          <div className="content-header">
            <h1>
              {currentView === "dashboard" && "Dashboard"}
              {currentView === "addCategory" &&
                (editingCategory ? "Edit Category" : "Add Category")}
              {/* {currentView === "manageCategories" && "Manage Categories"} */}
              {/* {currentView === "manageUsers" && "Manage Users"} */}
              {currentView === "analytics" && "Analytics"}
            </h1>
          </div>
          {renderView()}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;
