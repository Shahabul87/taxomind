export const fetcher = async (url: string): Promise<unknown> => {
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  
  return res.json() as Promise<unknown>;
}; 