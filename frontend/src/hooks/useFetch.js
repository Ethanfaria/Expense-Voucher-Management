import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get(url)
      .then((res) => !cancelled && setData(res.data))
      .catch(
        (err) =>
          !cancelled &&
          setError(err.response?.data?.error || "Could not load data")
      );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error };
}