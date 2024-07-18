import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});