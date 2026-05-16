import { useEffect, useState } from "react";

const API = "http://192.168.0.199:8000/api/announcements/";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.log(err));
  }, []);

  return announcements;
}
