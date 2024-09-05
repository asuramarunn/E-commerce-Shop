const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
    },
    price: {
      vnd: {
        type: Number,
      },
      cost: {
        type: Number,
      },
      discountPercent: {
        type: Number,
      },
    },
    subcategory: {
      type: String,
    },
    productImage: {
      type: String,
    },
    category: {
      type: String,
    },
    description: {
      type: String,
    },
    tagline: {
      type: String,
    },
    quantity: {
      type: Number,
    },
    reviews: [
      {
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "customer",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "seller",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", productSchema);
