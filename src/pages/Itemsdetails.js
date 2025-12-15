import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./styles.css";
import { useParams } from "react-router-dom";
import Usefetch from "../hooks/useGet";
import { Avatar, Wrap, WrapItem } from "@chakra-ui/react";
import { UseAuthContext } from "../hooks/useAuthContext";

function Itemsdetails() {
  const { user } = UseAuthContext();
  const API_BASE_URL = process.env.REACT_APP_URL;
  const { id } = useParams();

  const api = `${API_BASE_URL}/ip/item/oneitem/${id}`;
  const { data } = Usefetch(api);
  const items = data?.all_Items;

  // CHECK OWNERSHIP
  const isOwner =
    user &&
    items &&
    user.id === items.Item_poster?._id;

  // DELETE HANDLER
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

  return (
    <div>
      <Navbar />

      <div className="item_content">
        <div className="item_d_grid">
          {/* LEFT */}
          <div className="item_img_coll">
            {items ? (
              <div className="card" style={{ width: "95%" }}>
                <img
                  src={items.Item_Images}
                  className="card-img-top"
                  alt={items.Item_Name}
                />

                <div className="card-body">
                  <h5 className="card-title">{items.Item_Name}</h5>
                  <hr />
                  <p>{items.Item_Description}</p>
                  <p>Brand : {items.Item_Brand}</p>
                  <p>Address : {items.Item_poster?.Address}</p>
                  <hr />

                  <div className="but">
                    <button>
                      Birr : {items.Item_Price?.toLocaleString()}$
                    </button>
                    <span className="snav1">
                      <button>Add +</button>
                    </span>
                    <p>Make An offer</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="spinner-border text-warning" role="status" />
            )}
          </div>

          {/* RIGHT */}
          <div className="item_poster_coll">
            {items && (
              <>
                <div className="price">
                  <h3>ETB : {items.Item_Price.toLocaleString()} $</h3>
                  <hr />
                  <p>market price : {items.Item_Price + 500}</p>
                  <p>request callback</p>
                </div>

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

                  <p className="p">
                    <i className="fa-solid fa-phone">
                      <span> </span>
                      {items.Item_poster?.Phone}
                    </i>
                  </p>

                  <p className="p">
                    <i className="fa-brands fa-rocketchat">
                      <span> </span>start chat
                    </i>
                  </p>
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

                {/* DELETE — OWNER ONLY */}
                {isOwner && (
                  <div className="report">
                    <p className="delete-item" onClick={handleDelete}>
                      Delete item
                    </p>
                  </div>
                )}

                {!isOwner && (
                  <div className="report">
                    <p>Report Abuse</p>
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
