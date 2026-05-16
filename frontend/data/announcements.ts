import { useEffect, useState } from "react";
import { api } from "../services/api";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api
      .get("/announcements/")
      .then((res) => setAnnouncements(res.data))
      .catch((err) => console.log(err));
  }, []);

  return announcements;
}