import { useState, useEffect } from "react";
import { getSubjects } from "@/lib/localAuth";

export function useLocalSubjects() {
  const [subjects, setSubjects] = useState(getSubjects);

  useEffect(() => {
    setSubjects(getSubjects());
  }, []);

  return subjects;
}
