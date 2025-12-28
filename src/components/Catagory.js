import React from "react";
import "./Catagory.css";
import Usefetch from "../hooks/useGet";
import { Link } from "react-router-dom";

const Catagory = () => {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const api = `${API_BASE_URL}/ip/cat/allcat`;
  const { data } = Usefetch(api);

  const catagory = data?.cats;

  return (
    <div className="home-cat-section">
      <div className="home-cat-header">
        <h2>Category</h2>
        <button className="home-cat-view-all">
          <a href="/catagory">View All</a>
        </button>
      </div>

      {catagory ? (
        <div className="home-cat-list">
          {catagory.map((cat) => (
            <Link
              to={`/categorydetail/${cat._id}`}
              className="home-cat-item"
              key={cat._id}
            >
              <img src={cat.cat_pic} alt={cat.catagory_Name} />
              <p>{cat.catagory_Name}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default Catagory;
