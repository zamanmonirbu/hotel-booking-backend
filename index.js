const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
// const url=process.env.URL;
const url =
  "mongodb+srv://monir1181:monir1181087@cluster0.fwfzjhi.mongodb.net/hotel-booking?retryWrites=true&w=majority";

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(url, {});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// const hotelSchema = new mongoose.Schema({
//   id: String,
//   featured_image: String,
//   name: String,
//   cuisines: String,
//   average_cost_for_two: Number,
//   aggregate_rating: Number,
//   address: String,
//   small_address: String,
//   offer: String,
//   no_of_Delivery: Number,
//   latitude: Number,
//   longitude: Number,
//   time: String,
//   rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
// });
const hotelSchema = new mongoose.Schema({
    featured_image: String,
    name: String,
    cuisines: String,
    average_cost_for_two: Number,
    aggregate_rating: Number,
    address: String,
    small_address: String,
    offer: String,
    no_of_Delivery: Number,
    latitude: Number,
    longitude: Number,
    time: String,
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  });


  
  

// const roomSchema = new mongoose.Schema({
//   id: String,
//   name: String,
//   floor: String,
//   roomNumber: String,
//   balcony: String,
//   wifi: String,
//   review: Number,
//   star: Number,
//   bestSeller: String,
//   price: String,
//   image: String,
//   hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
// });
const roomSchema = new mongoose.Schema({
    id: String,
    name: String,
    floor: String,
    roomNumber: String,
    balcony: String,
    wifi: String,
    review: Number,
    star: Number,
    bestSeller: String,
    price: String,
    image: String,
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  });

  roomSchema.pre('save', async function (next) {
    // Get the hotel ID from the room
    const hotelId = this.hotel;
  
    // Update the hotel's rooms field with the new room's ID
    await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: this._id } });
  
    next();
  });

const bookingSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
  },
  checkInDate: Date,
  checkOutDate: Date,
  // Add more fields as needed
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  // Add more fields as needed
});

const Hotel = mongoose.model("Hotel", hotelSchema);
const Room = mongoose.model("Room", roomSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const User = mongoose.model("User", userSchema);

app.use(express.json());

// Registration API
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Username or password is incorrect" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ error: "Username or password is incorrect" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, "your-secret-key");

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new hotel
app.post("/hotels", async (req, res) => {
  try {
    const hotel = new Hotel(req.body);
    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a list of hotels
app.get("/hotels", async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
});

// Create a new room
// app.post("/rooms", async (req, res) => {
//   try {
//     const room = new Room(req.body);
//     const hotelId = room.hotel; // Get the hotel ID from the room data

//     // Save the room
//     await room.save();

//     // Update the hotel's rooms field with the new room's ID
//     await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: room._id } });

//     res.status(201).json(room);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Get a list of rooms
// app.get("/rooms", async (req, res) => {
//   const rooms = await Room.find();
//   res.json(rooms);
// });
// Create a new room
app.post('/rooms', async (req, res) => {
    try {
      const room = new Room(req.body);
    //   const hotelId = room.hotel; 
      const hotelId = req.body.hotel// Get the hotel ID from the room data
  console.log("Hotel ID",hotelId)
      // Save the room
      await room.save();
  
      // Update the hotel's rooms field with the new room's ID
      await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: room._id } });
  
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get a list of rooms
  app.get('/rooms', async (req, res) => {
    const rooms = await Room.find();
    res.json(rooms);
  });
  

// Protect this route with authentication
app.get("/secure-data", (req, res) => {
  // Verify the token in the request headers
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, "your-secret-key");
    // You can use `decoded.userId` to access the user's ID for further processing
    res.json({ message: "Secure data accessed successfully" });
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
