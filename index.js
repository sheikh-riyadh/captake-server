const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const moment = require("moment");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "https://seller-center-32880.web.app",
      "https://seller-center-32880.firebaseapp.com",
      "https://captake-web.firebaseapp.com",
      "https://captake-web.web.app",
      "https://admin-center-32881.web.app",
      "https://admin-center-32881.firebaseapp.com",
      // "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.options("*", cors());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.wjboujk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false,
};

const verify = async (req, res, next) => {
  const token = req.cookies?.captake_user_token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  jwt.verify(token, process.env.JWT_TOKEN, (error, decoded) => {
    if (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    req.user = decoded;
    next();
  });
};

const run = async () => {
  try {
    const database = client.db("captake");
    const user = database.collection("user");
    const user_address = database.collection("user_address");
    const user_report = database.collection("user_report");
    const user_order = database.collection("user_order");
    const user_review = database.collection("user_review");
    const feedback = database.collection("feedback");
    const admin_banner = database.collection("admin_banner");
    const admin_message = database.collection("admin_message");
    const seller = database.collection("seller");
    const seller_products = database.collection("seller_products");
    const seller_banner = database.collection("seller_banner");
    const seller_return_policy = database.collection("seller_return_policy");
    const seller_brands = database.collection("seller_brands");
    const seller_announcement = database.collection("seller_announcement");
    const product_questions = database.collection("product_questions");
    const counters = database.collection("counters");
    const category = database.collection("category");

    /*====================================
      JWT GENERATE
    ====================================== */
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "1d",
      });
      res
        .cookie("captake_user_token", token, cookieOptions)
        .status(201)
        .json({ message: "success" });
    });

    app.get("/logout", async (req, res) => {
      res
        .clearCookie("captake_user_token", { ...cookieOptions, maxAge: 0 })
        .status(200)
        .json({ message: "success" });
    });

    /*====================================
      1. User section start here
      ====================================*/

    app.get("/user/:email", verify, async (req, res) => {
      const takenEmail = req.params.email;
      if (takenEmail !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const option = {
        projection: { password: 0 },
      };

      try {
        const result = await user.findOne({ email: takenEmail }, option);
        if (result?._id) {
          res.status(200).json(result);
        } else {
          res.status(500).json({ message: "An error occurred" });
        }
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.post("/user-create", async (req, res) => {
      const userData = {
        ...req.body,
        role: "user",
        status: "active",
        createdAt: moment().toISOString(),
        date: moment().format("D"),
        month: moment().format("MMM"),
        year: moment().format("YYYY"),
      };
      try {
        const result = await user.insertOne(userData);
        if (result.acknowledged) {
          res.status(201).json({
            _id: result?.insertedId,
            acknowledged: result.acknowledged,
            email: userData?.email,
            role: "user",
            fName: userData.fName,
            lName: userData.lName,
            status: "active",
          });
        } else {
          res.status(500).json({ message: "An error occurred" });
        }
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.patch("/user-update", verify, async (req, res) => {
      const { _id, data } = req.body;
      if (data?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }

      const filter = { _id: new ObjectId(_id) },
        option = { upsert: true },
        updateData = {
          $set: {
            ...data,
          },
        };

      try {
        const result = await user.updateOne(filter, updateData, option);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "An error occurred while updating the user" });
      }
    });

    /*======================================
      2. User address section start here
     ======================================*/

    app.get("/user-address", verify, async (req, res) => {
      const { userId, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const query = { userId };
      try {
        const result = await user_address.find(query).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.post("/user-address-create", verify, async (req, res) => {
      const data = req.body;
      if (data?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }

      try {
        const result = await user_address.insertOne(data);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.patch("/user-address-update", verify, async (req, res) => {
      const { _id, data } = req.body;
      if (data?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const filter = { _id: new ObjectId(_id), userId: data?.userId },
        option = { upsert: true },
        updateData = {
          $set: {
            ...data,
          },
        };

      try {
        const result = await user_address.updateOne(filter, updateData, option);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "An error occurred while updating the address" });
      }
    });

    app.delete("/user-delete-address", verify, async (req, res) => {
      const { _id, userId, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const query = { _id: new ObjectId(_id), userId };
      try {
        const result = await user_address.deleteOne(query);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(404)
          .json({ message: "An error occurred while deleting the address" });
      }
    });

    /*====================================
      3. User report section start here
      ====================================*/

    app.get("/user-report", verify, async (req, res) => {
      const { id, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      try {
        const result = await user_report.find({ "from._id": id }).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.post("/user-add-report", verify, async (req, res) => {
      const data = req.body;
      if (data?.from?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }

      try {
        const result = await user_report.insertOne({
          ...data,
          createdAt: moment().toISOString(),
        });
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/reported-seller", verify, async (req, res) => {
      const { id, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      try {
        const result = await seller.findOne({ _id: new ObjectId(id) });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=====================================
      4. User feedback section start here
      =====================================*/

    app.post("/feedback", verify, async (req, res) => {
      const data = req.body;
      if (data?.user?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      try {
        const result = await feedback.insertOne({
          ...data,
          createdAt: moment().toISOString(),
        });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=======================================
      5. Seller products section start here
      =======================================*/

    app.get("/seller-products/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = await seller_products
          .find({ sellerId, status: "active" })
          .limit(6)
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/most-views-products", async (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 0;
      try {
        const result = await seller_products
          .aggregate([
            { $match: { status: "active" } },
            { $sort: { views: -1 } },
            { $skip: limit * page },
            { $limit: limit },
          ])
          .toArray();

        const total = await seller_products.countDocuments({
          status: "active",
        });

        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.patch("/update-views", async (req, res) => {
      const { _id } = req.body;
      const option = { upsert: true };
      const filter = { _id: new ObjectId(_id) };
      const updateData = { $inc: { views: 1 } };

      try {
        const result = await seller_products.updateOne(
          filter,
          updateData,
          option
        );

        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "An error occurred while updating the product" });
      }
    });

    /*==========================================================
      6. Seller products question & answer section start here
      ==========================================================*/

    app.get("/product-questions", async (req, res) => {
      const { productId, page = 1 } = req.query;
      const pageValue = parseInt(page, 10);
      try {
        const skip = Math.max(0, (pageValue - 1) * 10);

        const result = await product_questions
          .find({ "question.productInfo.productId": productId })
          .sort({ createdAt: -1 })
          .limit(10)
          .skip(skip)
          .toArray();

        const total = await product_questions.countDocuments({
          "question.productInfo.productId": productId,
        });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/product-search", async (req, res) => {
      const { title, limit, page, sellerId } = req.query;

      const query = {
        $or: [
          { title: { $regex: title, $options: "i" } },
          { category: { $regex: title, $options: "i" } },
          { brand: { $regex: title, $options: "i" } },
        ],
      };
      if (sellerId != "undefined") {
        query.sellerId = sellerId;
      }

      try {
        const result = await seller_products
          .find(query)
          .limit(parseInt(limit))
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/category-product", async (req, res) => {
      const { limit, sortedValue, category } = req.query;
      try {
        const result = await seller_products
          .find({ category, status: "active" })
          .limit(parseInt(limit))
          .sort({ price: parseInt(sortedValue) })
          .toArray();

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/user-product-questions", verify, async (req, res) => {
      const { userId, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }

      try {
        const result = await product_questions
          .find({ "question.userInfo.userId": userId })
          .sort({ updatedAt: -1 })
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error while finding question" });
      }
    });

    app.post("/product-question-create", verify, async (req, res) => {
      if (req?.body?.userInfo?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const data = {
        question: { ...req.body },
        answer: [],
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString(),
        date: moment().format("D"),
      };

      try {
        const result = await product_questions.insertOne(data);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.patch("/product-qestion-update", verify, async (req, res) => {
      const { _id, data } = req.body;
      if (data?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }

      const filter = {
        _id: new ObjectId(_id),
        "question.userInfo.userId": data?.userId,
      };
      const option = { upsert: false };
      updateData = {
        $set: {
          question: { ...data },
        },
      };
      try {
        const result = await product_questions.updateOne(
          filter,
          updateData,
          option
        );
        res.status(200).json(result);
      } catch (error) {
        res
          .status(404)
          .json({ message: "An error occurred while updating the question" });
      }
    });

    /*======================================
      7. Seller banner section start here
      ======================================*/

    app.get("/seller-default-banner/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;

      const option = {
        projection: { businessName: 1, logo: 1 },
      };

      try {
        const banner = await seller_banner.findOne({ sellerId, default: true });
        const store = await seller.findOne(
          { _id: new ObjectId(sellerId) },
          option
        );

        res.status(200).json({ banner, store });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*======================================
      8. Admin banner section start here
      ======================================*/

    app.get("/admin-default-banner", async (req, res) => {
      try {
        const banner = await admin_banner.findOne({ default: true });
        res.status(200).json(banner);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      9. Seller return policy section start here
      =============================================*/

    app.get("/seller-return-policy/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = await seller_return_policy.findOne({ sellerId });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      10. Seller brands section start here
      =============================================*/
    app.get("/seller-brands/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = await seller_brands.find({ sellerId }).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      11. Seller annoucement section start here
      =============================================*/

    app.get("/seller-announcement/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = await seller_announcement.findOne({ sellerId });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      12. User order section start here
      =============================================*/

    app.get("/order", verify, async (req, res) => {
      const { userId, email, page = 1, search } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const pageValue = parseInt(page, 10);

      const query = {
        userId,
        $or: [
          { orderId: search ? parseInt(search) : { $exists: true } },
          { date: { $regex: search, $options: "i" } },
          { paymentMethod: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
        ],
      };

      try {
        const skip = Math.max(0, (pageValue - 1) * 10);
        const result = await user_order
          .find(query)
          .sort({ createdAt: -1 })
          .limit(10)
          .skip(skip)
          .toArray();

        const total = await user_order.countDocuments({ userId });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.post("/create-order", verify, async (req, res) => {
      const data = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid order data" });
      }

      if (data[0]?.userInfo?.email !== req.user.email) {
        return res.status(403).json({ message: "Forbidden access" });
      }

      try {
        // Ensure the counter is initialized
        const initResult = await counters.updateOne(
          { _id: "orderId" },
          { $setOnInsert: { seq: 0 } },
          { upsert: true }
        );

        // Increment and fetch updated counter value
        const counterResult = await counters.findOneAndUpdate(
          { _id: "orderId" },
          { $inc: { seq: 3241 } },
          {
            returnDocument: "after",
            upsert: true,
          }
        );

        // Safely access the updated sequence
        const seqValue = counterResult.value
          ? counterResult.value.seq
          : counterResult.seq;

        if (typeof seqValue !== "number") {
          return res
            .status(500)
            .json({ message: "Failed to generate orderId" });
        }

        // Generate new order data
        const newData = data.map((item, index) => ({
          ...item,
          orderId: seqValue + (index + 100),
          createdAt: moment().toISOString(),
          status: "pending",
          date: moment().format("D"),
          month: moment().format("MMM"),
          year: moment().format("YYYY"),
        }));

        const insertResult = await user_order.insertMany(newData);

        res.status(200).json(insertResult);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.patch("/update-order", verify, async (req, res) => {
      const { _id, data } = req.body;
      if (data?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const filter = { _id: new ObjectId(_id), userId: data?.userId };
      const updateData = {
        $set: {
          status: data?.status,
          updatedDate: moment().format("D"),
          updatedMonth: moment().format("MMM"),
          updatedYear: moment().format("YYYY"),
          cancelledDate: moment().toISOString(),
        },
      };

      try {
        const result = await user_order.updateOne(filter, updateData, {
          returnDocument: "after", // Return the updated document
          upsert: false, // No need to create a new document if one doesn't exist
        });

        res.status(200).json(result); // Return the updated order details
      } catch (error) {
        res.status(500).json({
          message: "An error occurred while updating the order",
          error,
        });
      }
    });

    /*=============================================
      13. User review section start here
      =============================================*/

    app.get("/review", verify, async (req, res) => {
      const { userId, email, page, search = "" } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const pageValue = parseInt(page, 10);

      const query = {
        userId,
        $or: [
          { orderId: search ? parseInt(search) : { $exists: true } },
          { reviewMessage: { $regex: search, $options: "i" } },
          { "rating.rating": { $regex: search, $options: "i" } },
        ],
      };

      try {
        const skip = Math.max(0, (pageValue - 1) * 10);

        const result = await user_review
          .find(query)
          .sort({ createdAt: -1 })
          .limit(10)
          .skip(skip)
          .toArray();

        const total = await user_review.countDocuments({ userId });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/review-orderId", verify, async (req, res) => {
      const { orderId, email } = req.query;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      try {
        const result = await user_review.findOne({
          orderId: parseInt(orderId),
        });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/review-productId", async (req, res) => {
      const { productId, page = 1 } = req.query;
      const pageValue = parseInt(page, 10);

      try {
        const skip = Math.max(0, (pageValue - 1) * 10);

        const result = await user_review
          .find({ "productInfo.productId": productId })
          .sort({ createdAt: -1 })
          .limit(10)
          .skip(skip)
          .toArray();
        const total = await user_review.countDocuments({
          "productInfo.productId": productId,
        });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.post("/create-review", verify, async (req, res) => {
      const data = req.body;
      if (data?.userInfo?.email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      const newData = {
        ...data,
        createdAt: moment().toISOString(),
      };

      try {
        const result = await user_review.insertOne(newData);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      14. All store  section start here
      =============================================*/

    app.get("/all-seller", async (req, res) => {
      const { limit = 10, page = 1, sortedValue } = req.query;
      const pageValue = parseInt(page, 10);

      const option = {
        projection: { logo: 1, businessName: 1 },
      };
      try {
        const skip = Math.max(0, (pageValue - 1) * 10);

        const result = await seller
          .find({ status: "active" }, option)
          .sort({ createdAt: parseInt(sortedValue) })
          .limit(parseInt(limit))
          .skip(skip)
          .toArray();

        const total = await seller.countDocuments({ status: "active" });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/seller-banner/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      try {
        const result = await seller_banner.find({ sellerId }).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/seller-rating-products", async (req, res) => {
      const sellerId = req.query.sellerId;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 0;
      const star = parseInt(req.query.star) || 3;

      try {
        const result = await user_review
          .aggregate([
            { $match: { "rating.rating": { $gt: star }, sellerId } },
            { $project: { productInfo: "$productInfo.productId", _id: 0 } },
            { $unwind: "$productInfo" },
            {
              $group: { _id: null, productIds: { $addToSet: "$productInfo" } },
            },
            { $project: { _id: 0, productIds: 1 } },
            { $sort: { createdAt: -1 } },
            { $skip: limit * page },
            { $limit: limit },
          ])
          .toArray();

        const productIds =
          result.length > 0 ? [...new Set(result[0].productIds)] : [];

        const objectIds = productIds.map((id) => new ObjectId(id));

        const products = await seller_products
          .find({ _id: { $in: objectIds } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(page * limit)
          .toArray();
        const total = await user_review.countDocuments({
          sellerId,
          "rating.rating": { $exists: true, $gt: star },
        });

        if (products?.length) {
          res.status(200).json({ total, data: products });
        } else {
          try {
            const result = await seller_products
              .aggregate([
                { $match: { status: "active", sellerId } },
                { $sort: { views: -1 } },
                { $limit: 4 },
              ])
              .toArray();

            const total = await seller_products.countDocuments({
              status: "active",
              sellerId,
            });

            res.status(200).json({ total, data: result });
          } catch (error) {
            res.status(500).json({ message: "An error occurred" });
          }
        }
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/seller-all-review", async (req, res) => {
      const { limit = 10, sellerId, sortedValue, page = 1 } = req.query;
      const pageValue = parseInt(page, 10);

      try {
        const skip = Math.max(0, (pageValue - 1) * 10);
        const result = await user_review
          .find({ sellerId })
          .sort({ createdAt: parseInt(sortedValue) })
          .limit(parseInt(limit))
          .skip(skip)
          .toArray();
        const total = await user_review.countDocuments({ sellerId });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/seller-most-views-products", async (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 0;
      const sellerId = req.query.sellerId;
      try {
        const result = await seller_products
          .aggregate([
            { $match: { status: "active", sellerId } },
            { $sort: { views: -1 } },
            { $skip: limit * page },
            { $limit: limit },
          ])
          .toArray();

        const total = await seller_products.countDocuments({
          status: "active",
          sellerId,
        });

        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/seller-latest-product", async (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 0;
      const sellerId = req.query.sellerId;

      try {
        const result = await seller_products
          .find({ sellerId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(page * limit)
          .toArray();
        const total = await seller_products.countDocuments({
          status: "active",
          sellerId,
        });
        res.status(200).json({ total, data: result });
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    /*=============================================
      15. Category section start here
      =============================================*/

    app.get("/categories", async (req, res) => {
      try {
        const result = await category
          .find({})
          .limit(16)
          .sort({ createdAt: -1 })
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "An error occurred" });
      }
    });

    app.get("/category-products", async (req, res) => {
      const { limit = 10, sortedValue, category, page = 1 } = req.query;

      const sortOrder = parseInt(sortedValue);

      const limitValue = parseInt(limit, 10);
      const pageValue = parseInt(page, 10);

      try {
        const skip = Math.max(0, (pageValue - 1) * limitValue);

        const pipeline = [
          {
            $match: { category, status: "active" },
          },
          {
            $addFields: {
              sortPrice: {
                $cond: {
                  if: { $gt: ["$specialPrice", 0] },
                  then: "$specialPrice",
                  else: "$price",
                },
              },
            },
          },
          {
            $sort: { sortPrice: sortOrder },
          },
          {
            $skip: skip,
          },
          {
            $limit: limitValue,
          },
        ];

        const result = await seller_products.aggregate(pipeline).toArray();
        const total = await seller_products.countDocuments({ category });

        // Return the response
        res.status(200).json({ total, data: result });
      } catch (error) {
        console.error("Error:", error); // Log the error to console for debugging
        res.status(500).json({
          message: "Error while finding category products",
          error: error.message,
        });
      }
    });

    /*=============================================
      16. Admin message section start here
      =============================================*/

    app.get("/admin-message/:email", verify, async (req, res) => {
      const email = req.params.email;
      if (email !== req?.user?.email) {
        res.status(403).json({ message: "forbidden access" });
        return;
      }
      try {
        const result = await admin_message
          .find({ to: "user" })
          .sort({ date: -1 })
          .toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Error while finding message" });
      }
    });
  } finally {
  }
};
run().catch((e) => console.error(e));

app.get("/", (req, res) => {
  res.send("Hello developer!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
