import { Pagination as UIPagination } from "@rymel/ui";

/** Adaptador de `Pagination` de @rymel/ui con la API del admin (`currentPage`). */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export const Pagination = ({ currentPage, ...props }: PaginationProps) =>
  props.totalPages <= 1 ? null : (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <UIPagination page={currentPage} {...props} />
    </div>
  );
