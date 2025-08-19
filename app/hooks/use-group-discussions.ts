import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface UseGroupDiscussionsProps {
  groupId: string;
  page?: number;
  limit?: number;
}

interface DiscussionsResponse {
  discussions: Array<any>;
  metadata?: any;
}

export const useGroupDiscussions = ({ groupId, page = 1, limit = 10 }: UseGroupDiscussionsProps) => {
  const { data, error, isLoading, mutate } = useSWR<DiscussionsResponse>(
    `/api/groups/${groupId}/discussions?page=${page}&limit=${limit}`,
    fetcher as (url: string) => Promise<DiscussionsResponse>
  );

  return {
    discussions: data?.discussions || [],
    metadata: data?.metadata,
    isLoading,
    error,
    mutate,
  };
}; 