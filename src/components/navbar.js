import React, { useState } from "react";
import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { UseAuthContext } from "../hooks/useAuthContext";
import { UseLogout } from "../hooks/useLogout";
import { Avatar, Wrap, WrapItem } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import Usefetch from "../hooks/useGet";
import { useCart } from "../contexts/CartContext";

const Navbar = () => {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const api = `${API_BASE_URL}/ip/cat/allcat`;
  const { data } = Usefetch(api);
  const navigate = useNavigate();

  const categories = data?.cats || [];
  // console.log('Categories:', categories);

  const { user } = UseAuthContext();
  const { cartItems, getCartCount } = useCart();
  const [search, setSearch] = useState("");
  const [Loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const Toast = useToast();

  // console.log("search", searchResult);

  const handle_Search = async (query) => {
    setSearch(query);

    if (!query || query.trim() === "") {
      setSearchResult([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setLoading(true);
      setShowSearchResults(true);
      const { data } = await axios.get(
        `${API_BASE_URL}/ip/item?search=${query}`
      );
      const items = data.Item || [];
      // console.log(items);
      setLoading(false);
      setSearchResult(items);
    } catch (error) {
      Toast({
        title: "Error Occurred!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
      setSearchResult([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setShowSearchResults(false);
      setSearch("");
    }
  };

  const handleResultClick = (itemId) => {
    navigate(`/itemdetail/${itemId}`);
    setShowSearchResults(false);
    setSearch("");
  };

  const handleSearchBlur = () => {
    // Hide results after a short delay to allow clicking on results
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (search.trim() && searchResult.length > 0) {
      setShowSearchResults(true);
    }
  };

  const { logout } = UseLogout();
  const handle_logout = () => {
    logout();
  };

  return (
    <React.Fragment>
      <nav className="navbar">
        <a className="navbar-brand me-auto" href="/">
          <i className="fa-solid fa-spa"></i>
          MK_cosmo
        </a>

        <div className="search">
          <form className="d-flex flex-grow-1" onSubmit={handleSearchSubmit}>
            <div className="search-container" style={{ position: "relative" }}>
              <input
                className="form-control flex-grow-1"
                type="search"
                placeholder="Search items"
                aria-label="Search"
                style={{ width: "400px" }}
                value={search}
                onChange={(e) => handle_Search(e.target.value)}
                onBlur={handleSearchBlur}
                onFocus={handleSearchFocus}
              />

              {/* Search button inside input */}
              <button
                type="submit"
                className="search-button"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#ff4444",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="search-results-dropdown">
                  {Loading ? (
                    <div className="search-loading">
                      <div
                        className="spinner-border text-warning"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : searchResult.length > 0 ? (
                    <div className="search-results-list">
                      {searchResult.slice(0, 5).map((it) => (
                        <div
                          key={it._id}
                          className="search-result-item-link"
                          role="button"
                          tabIndex={0}
                          onMouseDown={(e) => {
                            // Ensure navigation happens before input blur hides dropdown
                            e.preventDefault();
                            handleResultClick(it._id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleResultClick(it._id);
                            }
                          }}
                        >
                          <div className="search-result-item">
                            <img
                              className="search-result-img"
                              src={it.Item_Images}
                              alt={it.Item_Brand}
                            />
                            <div className="search-result-details">
                              <h6>{it.Item_Brand}</h6>
                              <p>
                                {it.Item_Description?.substring(0, 50) ||
                                  "No description available"}
                                ...
                              </p>
                              <span className="search-result-price">
                                ${it.Item_Price}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {searchResult.length > 5 && (
                        <div
                          className="search-view-all"
                          onClick={() => {
                            navigate(`/search?q=${encodeURIComponent(search)}`);
                            setShowSearchResults(false);
                            setSearch("");
                          }}
                        >
                          View all {searchResult.length} results
                        </div>
                      )}
                    </div>
                  ) : search.trim() && !Loading ? (
                    <div className="search-no-results">
                      No results found for "{search}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="nav-right-section">
          {/* Cart Icon */}

          {/* Login/Logout Buttons */}
          <div className="btns">
            {!user && (
              <Link to="/login">
                <button className="btn btn-light ms-3">Login</button>
              </Link>
            )}
            {user && (
              <Link to="/">
                <button className="btn btn-light ms-3" onClick={handle_logout}>
                  Log out
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="snav">
        <ul>
          <li>
            <Link to="/"> Home</Link>
          </li>
          <li>
            <Link to="/cart">
              Cart
              {getCartCount() > 0 && (
                <span className="cart-badge-snav">({getCartCount()})</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/catagory"> Category</Link>
          </li>

          {/* Show first 3 categories in main navbar */}
          {categories.length > 0 &&
            categories.slice(0, 3).map((cat) => (
              <li key={cat._id}>
                <Link to={`/categorydetail/${cat._id}`}>
                  {cat.catagory_Name}
                </Link>
              </li>
            ))}

          {user && (
            <li>
              <Link to="/user">Account</Link>
            </li>
          )}
          {!user && (
            <li>
              <Link to="/login">Account</Link>
            </li>
          )}

          {user && user.isAdmin && (
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
          )}
        </ul>

        <div id="icon_and_sell">
          <div>
            {user && (
              <button>
                <Link to="/additem" className="b">
                  SELL
                </Link>
              </button>
            )}
            {!user && (
              <button>
                <Link to="/login" className="b">
                  SELL_ITEM
                </Link>
              </button>
            )}
          </div>

          {/* Desktop Cart Icon */}
          <div className="cart-icon-desktop">
            <Link to="/cart">
              <i className="fa-solid fa-shopping-cart"></i>
              {getCartCount() > 0 && (
                <span className="cart-badge-desktop">{getCartCount()}</span>
              )}
            </Link>
          </div>

          <div id="profile_pic_nave">
            {user && (
              <Link to="/user">
                <Wrap>
                  <WrapItem>
                    <Avatar size="md" name="Segun Adebayo" src={user.pic} />
                  </WrapItem>
                </Wrap>
              </Link>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Navbar;
