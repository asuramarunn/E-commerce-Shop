import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { Box, Button, Checkbox, FormControlLabel } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../../components/Popup";
import {
  fetchProductDetailsFromCart,
  removeAllFromCart,
  removeSpecificProduct,
} from "../../../redux/userSlice";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { addStuff } from "../../../redux/userHandle";

const BASE_URL = "http://localhost:5000";

const PaymentForm = ({ handleBack }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, currentUser, productDetailsCart } = useSelector(
    (state) => state.user
  );
  const [clientId, setClientId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal");

  const params = useParams();
  const productID = params.id;

  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (productID) {
      dispatch(fetchProductDetailsFromCart(productID));
    }
  }, [productID, dispatch]);

  useEffect(() => {
    getPaypalClientID();
  }, []);

  const getPaypalClientID = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/config/paypal`);
      if (response.data) {
        setClientId(response.data);
      } else {
        throw new Error("Invalid clientId");
      }
    } catch (error) {
      console.error("Error fetching PayPal clientId:", error);
      setMessage("Failed to connect to PayPal. Please try again later.");
      setShowPopup(true);
    }
  };

  const productsQuantity = currentUser.cartDetails.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const totalPrice = currentUser.cartDetails.reduce(
    (total, item) => total + item.quantity * item.price.cost,
    0
  );

  const singleProductQuantity =
    productDetailsCart && productDetailsCart.quantity;
  const totalsingleProductPrice =
    productDetailsCart &&
    productDetailsCart.price &&
    productDetailsCart.price.cost * productDetailsCart.quantity;

  const multiOrderData = {
    buyer: currentUser._id,
    shippingData: currentUser.shippingData,
    orderedProducts: currentUser.cartDetails.map(item => ({
      _id: item._id,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price.cost,
      seller: item.seller,
      category: item.category,
      subcategory: item.subcategory
    })),
    paymentInfo: {}, 
    productsQuantity,
    totalPrice,
  };

  const singleOrderData = {
    buyer: currentUser._id,
    shippingData: currentUser.shippingData,
    orderedProducts: [{
      _id: productDetailsCart._id,
      productName: productDetailsCart.productName,
      quantity: productDetailsCart.quantity,
      price: productDetailsCart.price.cost,
      seller: productDetailsCart.seller._id,
      category: productDetailsCart.category,
      subcategory: productDetailsCart.subcategory
    }],
    paymentInfo: {}, 
    productsQuantity: singleProductQuantity,
    totalPrice: totalsingleProductPrice,
  };

  const handleOrderPlacement = async (paymentResult) => {
    const paymentInfo = paymentMethod === "paypal"
      ? {
          id: paymentResult.id,
          status: paymentResult.status,
        }
      : {
          id: "COD",
          status: "Paid on Delivery",
        };
  
    const orderData = productID ? singleOrderData : multiOrderData;
    orderData.paymentInfo = paymentInfo;
  
    console.log(orderData); // Xem dữ liệu đơn hàng trước khi gửi
  
    try {
      if (productID) {
        await dispatch(addStuff("newOrder", orderData));
        await dispatch(removeSpecificProduct(productID));
      } else {
        await dispatch(addStuff("newOrder", orderData));
        await dispatch(removeAllFromCart());
      }
  
      await axios.put(`${BASE_URL}/update-stock`, {
        orderedProducts: orderData.orderedProducts,
      });
  
    } catch (error) {
      console.error('Error placing order or updating stock:', error);
    }
  };
  

  useEffect(() => {
    if (status === "added") {
      navigate("/Aftermath");
    } else if (status === "failed") {
      setMessage("Order Failed");
      setShowPopup(true);
    } else if (status === "error") {
      setMessage("Network Error");
      setShowPopup(true);
    }
  }, [status, navigate]);

  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        Payment method
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
        }
        label="Cash on Delivery"
      />
      {clientId && paymentMethod === "paypal" && (
        <PayPalScriptProvider options={{ clientId, debug: true }}>
          <PayPalButtons
            createOrder={(data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: totalPrice.toFixed(2),
                    },
                  },
                ],
              });
            }}
            onApprove={(data, actions) => {
              return actions.order.capture().then(function (details) {
                handleOrderPlacement(details);
              });
            }}
            onError={(error) => {
              console.error("PayPal Error:", error);
              setMessage("PayPal connection error: " + error.message);
              setShowPopup(true);
            }}
          />
        </PayPalScriptProvider>
      )}
      {paymentMethod === "cod" && (
        <>
          <Typography variant="body1" gutterBottom>
            You have selected Cash on Delivery.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOrderPlacement({ id: "COD", status: "Paid on Delivery" })}
            sx={{ mt: 2 }}
          >
            Confirm Order
          </Button>
        </>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
          Back
        </Button>
      </Box>
      <Popup
        message={message}
        setShowPopup={setShowPopup}
        showPopup={showPopup}
      />
    </React.Fragment>
  );
};

export default PaymentForm;
