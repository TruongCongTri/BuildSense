import { useState } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

function App() {
  const [count, setCount] = useState(0);

  const listRouter = createBrowserRouter([
    {
      path: "/",
      element: <h1>Home</h1>,
      errorElement: <h1>Not Found</h1>
    },
  ]);
  return <RouterProvider router={listRouter} />;
}

export default App;
