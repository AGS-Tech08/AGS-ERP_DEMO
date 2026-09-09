import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  Download,
  Edit,
  FileSpreadsheet,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import api from "../../services/api";
import ProductModal from "./ProductModal";

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category?: string | null;
  brand?: string | null;
  hsn_code?: string | null;
  unit?: string | null;
  purchase_price?: string | number;
  selling_price?: string | number;
  opening_stock?: string | number;
  current_stock?: string | number;
  minimum_stock?: string | number;
  gst_percentage?: string | number;
  product_status?: string | null;
  description?: string | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

interface ImportErrorItem {
  row: number;
  message: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportErrorItem[];
}

export default function ProductList() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [brandFilter, setBrandFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      current_page: 1,
      last_page: 1,
      total: 0,
    });

  const [openFilter, setOpenFilter] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [openImportModal, setOpenImportModal] =
    useState(false);

  const [selectedExcelFile, setSelectedExcelFile] =
    useState<File | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [importLoading, setImportLoading] =
    useState(false);

  const [importMessage, setImportMessage] =
    useState("");

  const [importError, setImportError] =
    useState("");

  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * ---------------------------------------------------------
   * LOAD PRODUCTS
   * ---------------------------------------------------------
   */
  const loadProducts = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true);

      const response =
        await api.get("/products", {
          params: {
            page: requestedPage,
            search:
              search || undefined,
            category:
              categoryFilter || undefined,
            brand:
              brandFilter || undefined,
            product_status:
              statusFilter || undefined,
          },
        });

      const payload =
        response.data;

      if (
        payload?.data?.data &&
        Array.isArray(
          payload.data.data
        )
      ) {
        setProducts(
          payload.data.data
        );

        setPagination({
          current_page:
            payload.data.current_page ??
            requestedPage,
          last_page:
            payload.data.last_page ??
            1,
          total:
            payload.data.total ??
            payload.data.data.length,
        });

        return;
      }

      if (
        Array.isArray(payload?.data)
      ) {
        setProducts(
          payload.data
        );

        setPagination({
          current_page: 1,
          last_page: 1,
          total:
            payload.data.length,
        });

        return;
      }

      setProducts([]);

      setPagination({
        current_page: 1,
        last_page: 1,
        total: 0,
      });
    } catch (error) {
      console.error(
        "Product Load Error:",
        error
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts(page);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    categoryFilter,
    brandFilter,
    statusFilter,
  ]);

  /*
   * ---------------------------------------------------------
   * ADD PRODUCT
   * ---------------------------------------------------------
   */
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setOpenModal(true);
  };

  /*
   * ---------------------------------------------------------
   * EDIT PRODUCT
   * ---------------------------------------------------------
   */
  const handleEditProduct = (
    product: Product
  ) => {
    setSelectedProduct(product);
    setOpenModal(true);
  };

  /*
   * ---------------------------------------------------------
   * PRODUCT MODAL CLOSE
   * ---------------------------------------------------------
   */
  const handleProductModalClose = () => {
    setOpenModal(false);
    setSelectedProduct(null);
  };

  /*
   * ---------------------------------------------------------
   * PRODUCT SUCCESS
   * ---------------------------------------------------------
   */
  const handleProductSuccess = () => {
    setOpenModal(false);
    setSelectedProduct(null);

    void loadProducts(page);
  };

  /*
   * ---------------------------------------------------------
   * DELETE PRODUCT
   * ---------------------------------------------------------
   */
  const handleDeleteProduct = async (
    product: Product
  ) => {
    const confirmed =
      window.confirm(
        `Delete product "${product.product_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/products/${product.id}`
      );

      await loadProducts(page);
    } catch (error: any) {
      console.error(
        "Product Delete Error:",
        error
      );

      alert(
        error?.response?.data?.message ??
          "Unable to delete product."
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */
  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value);
    setPage(1);
  };

  /*
   * ---------------------------------------------------------
   * EXPORT CSV
   * ---------------------------------------------------------
   */
  const handleExportCSV = () => {
    if (products.length === 0) {
      alert(
        "No products available to export."
      );

      return;
    }

    const headers = [
      "Product Code",
      "Product Name",
      "Category",
      "Brand",
      "HSN/SAC",
      "Unit",
      "Purchase Price",
      "Selling Price",
      "GST %",
      "Opening Stock",
      "Current Stock",
      "Minimum Stock",
      "Status",
    ];

    const rows =
      products.map(
        (product) => [
          product.product_code,
          product.product_name,
          product.category ?? "",
          product.brand ?? "",
          product.hsn_code ?? "",
          product.unit ?? "",
          product.purchase_price ?? 0,
          product.selling_price ?? 0,
          product.gst_percentage ?? 0,
          product.opening_stock ?? 0,
          product.current_stock ?? 0,
          product.minimum_stock ?? 0,
          product.product_status ?? "",
        ]
      );

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => {
              const text =
                String(
                  value ?? ""
                );

              return `"${text.replace(
                /"/g,
                '""'
              )}"`;
            })
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "AGS_ERP_Products.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };

  /*
   * ---------------------------------------------------------
   * OPEN IMPORT MODAL
   * ---------------------------------------------------------
   */
  const handleOpenImport = () => {
    setOpenImportModal(true);
    setSelectedExcelFile(null);
    setImportMessage("");
    setImportError("");
    setImportResult(null);
  };

  /*
   * ---------------------------------------------------------
   * CLOSE IMPORT MODAL
   * ---------------------------------------------------------
   */
  const handleCloseImport = () => {
    if (importLoading) {
      return;
    }

    setOpenImportModal(false);
    setSelectedExcelFile(null);
    setImportMessage("");
    setImportError("");
    setImportResult(null);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  /*
   * ---------------------------------------------------------
   * FILE VALIDATION
   * ---------------------------------------------------------
   */
  const validateExcelFile = (
    file: File
  ): boolean => {

    const name =
      file.name.toLowerCase();

    const allowed =
      [".xlsx", ".xls", ".csv"];

    const validExtension =
      allowed.some(
        (extension) =>
          name.endsWith(
            extension
          )
      );

    if (!validExtension) {
      setImportError(
        "Please select .xlsx, .xls or .csv file."
      );

      setSelectedExcelFile(null);

      return false;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setImportError(
        "File size must be 10 MB or less."
      );

      setSelectedExcelFile(null);

      return false;
    }

    setSelectedExcelFile(file);
    setImportError("");
    setImportMessage("");
    setImportResult(null);

    return true;
  };

  /*
   * ---------------------------------------------------------
   * FILE SELECT
   * ---------------------------------------------------------
   */
  const handleExcelFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    validateExcelFile(file);
  };

  /*
   * ---------------------------------------------------------
   * DRAG EVENTS
   * ---------------------------------------------------------
   */
  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    validateExcelFile(file);
  };

  /*
   * ---------------------------------------------------------
   * REMOVE FILE
   * ---------------------------------------------------------
   */
  const handleRemoveFile = () => {
    if (importLoading) {
      return;
    }

    setSelectedExcelFile(null);
    setImportMessage("");
    setImportError("");
    setImportResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  /*
   * ---------------------------------------------------------
   * DOWNLOAD TEMPLATE
   * ---------------------------------------------------------
   */
  const handleDownloadTemplate = () => {
    const headers = [
      "Product Code",
      "Product Name",
      "Category",
      "Brand",
      "Unit",
      "Purchase Price",
      "Selling Price",
      "GST %",
      "HSN/SAC",
      "Opening Stock",
      "Minimum Stock",
    ];

    const sample = [
      "",
      "Example Product",
      "General",
      "AGS",
      "PCS",
      "100",
      "150",
      "18",
      "85258090",
      "10",
      "2",
    ];

    const csvContent =
      [headers, sample]
        .map((row) =>
          row
            .map((value) => {
              const text =
                String(
                  value ?? ""
                );

              return `"${text.replace(
                /"/g,
                '""'
              )}"`;
            })
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "AGS_ERP_Product_Import_Template.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };

  /*
   * ---------------------------------------------------------
   * IMPORT EXCEL
   * ---------------------------------------------------------
   */
  const handleImportExcel = async () => {
    if (!selectedExcelFile) {
      setImportError(
        "Please select an Excel file first."
      );

      return;
    }

    try {
      setImportLoading(true);
      setImportError("");
      setImportMessage("");
      setImportResult(null);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedExcelFile
      );

      const response =
        await api.post(
          "/products/import",
          formData
        );

      console.log(
        "Product Excel Import Response:",
        response.data
      );

      const responseData =
        response.data;

      const resultData =
        responseData?.data ?? {};

      const result: ImportResult = {
        imported:
          Number(
            resultData.imported ?? 0
          ),

        skipped:
          Number(
            resultData.skipped ?? 0
          ),

        errors:
          Array.isArray(
            resultData.errors
          )
            ? resultData.errors
            : [],
      };

      setImportResult(
        result
      );

      setImportMessage(
        responseData?.message ??
          "Product import completed."
      );

      setSelectedExcelFile(
        null
      );

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setPage(1);

      await loadProducts(1);

    } catch (error: any) {

      console.error(
        "Product Excel Import Error:",
        error
      );

      console.error(
        "IMPORT STATUS:",
        error?.response?.status
      );

      console.error(
        "IMPORT RESPONSE:",
        error?.response?.data
      );

      const responseData =
        error?.response?.data;

      let message =
        "Unable to import Excel file.";

      if (
        responseData?.message
      ) {
        message =
          String(
            responseData.message
          );
      }

      if (
        responseData?.errors?.file &&
        Array.isArray(
          responseData.errors.file
        )
      ) {
        message =
          responseData.errors.file.join(
            " "
          );
      }

      if (
        responseData?.error
      ) {
        message =
          `${message} ${responseData.error}`;
      }

      setImportError(
        message
      );

      const rowErrors =
        responseData?.data?.errors;

      if (
        Array.isArray(
          rowErrors
        )
      ) {
        setImportResult({
          imported:
            Number(
              responseData?.data?.imported ??
                0
            ),

          skipped:
            Number(
              responseData?.data?.skipped ??
                0
            ),

          errors:
            rowErrors,
        });
      }

    } finally {

      setImportLoading(
        false
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */
  const handlePreviousPage = () => {

    if (
      pagination.current_page <=
      1
    ) {
      return;
    }

    setPage(
      pagination.current_page -
        1
    );
  };

  const handleNextPage = () => {

    if (
      pagination.current_page >=
      pagination.last_page
    ) {
      return;
    }

    setPage(
      pagination.current_page +
        1
    );
  };

  /*
   * ---------------------------------------------------------
   * CURRENCY
   * ---------------------------------------------------------
   */
  const formatCurrency = (
    value:
      | string
      | number
      | undefined
  ) => {

    return Number(
      value ?? 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage products, stock, pricing and GST.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {/* ADD */}
          <button
            type="button"
            onClick={
              handleAddProduct
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Product
          </button>

          {/* IMPORT */}
          <button
            type="button"
            onClick={
              handleOpenImport
            }
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <FileSpreadsheet
              size={17}
            />
            Import Excel
          </button>

          {/* FILTER */}
          <button
            type="button"
            onClick={() =>
              setOpenFilter(
                (value) => !value
              )
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold ${
              openFilter
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter size={17} />
            Filter
          </button>

          {/* EXPORT */}
          <button
            type="button"
            onClick={
              handleExportCSV
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={17} />
            Export CSV
          </button>

          {/* REFRESH */}
          <button
            type="button"
            onClick={() =>
              void loadProducts(
                page
              )
            }
            className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-700 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

        </div>

      </div>

      {/* SEARCH / FILTER */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

          <div className="relative lg:col-span-2">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
              placeholder="Search product code, name, category or brand..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {openFilter && (
            <>
              <input
                type="text"
                value={
                  categoryFilter
                }
                onChange={(event) => {
                  setCategoryFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                placeholder="Category"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <input
                type="text"
                value={brandFilter}
                onChange={(event) => {
                  setBrandFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                placeholder="Brand"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={
                  statusFilter
                }
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </>
          )}

        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-50">

              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                <th className="px-4 py-3">
                  Code
                </th>

                <th className="px-4 py-3">
                  Product
                </th>

                <th className="px-4 py-3">
                  Category
                </th>

                <th className="px-4 py-3">
                  Brand
                </th>

                <th className="px-4 py-3">
                  Unit
                </th>

                <th className="px-4 py-3 text-right">
                  Purchase
                </th>

                <th className="px-4 py-3 text-right">
                  Selling
                </th>

                <th className="px-4 py-3 text-right">
                  Stock
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>

                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-500"
                  >

                    <div className="flex items-center justify-center gap-2">

                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Loading products...

                    </div>

                  </td>

                </tr>

              ) : products.length === 0 ? (

                <tr>

                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No products found.
                  </td>

                </tr>

              ) : (

                products.map(
                  (product) => (

                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                        {
                          product.product_code
                        }
                      </td>

                      <td className="px-4 py-3">

                        <div className="font-medium text-slate-900">
                          {
                            product.product_name
                          }
                        </div>

                        {product.hsn_code && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            HSN/SAC:{" "}
                            {
                              product.hsn_code
                            }
                          </div>
                        )}

                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {
                          product.category ||
                          "-"
                        }
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {
                          product.brand ||
                          "-"
                        }
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {
                          product.unit ||
                          "PCS"
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        ₹{" "}
                        {formatCurrency(
                          product.purchase_price
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        ₹{" "}
                        {formatCurrency(
                          product.selling_price
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">

                        <div className="font-semibold">
                          {Number(
                            product.current_stock ??
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          Min:{" "}
                          {Number(
                            product.minimum_stock ??
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </div>

                      </td>

                      <td className="px-4 py-3">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.product_status ===
                            "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {
                            product.product_status ||
                            "Active"
                          }
                        </span>

                      </td>

                      <td className="px-4 py-3">

                        <div className="flex justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              handleEditProduct(
                                product
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit Product"
                          >
                            <Edit
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteProduct(
                                product
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete Product"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm text-slate-500">
            Total:{" "}
            <span className="font-semibold text-slate-700">
              {
                pagination.total
              }
            </span>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={
                handlePreviousPage
              }
              disabled={
                pagination.current_page <=
                1
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center text-sm text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {
                  pagination.current_page
                }
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {
                  pagination.last_page
                }
              </span>
            </span>

            <button
              type="button"
              onClick={
                handleNextPage
              }
              disabled={
                pagination.current_page >=
                pagination.last_page
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* PRODUCT MODAL */}
      <ProductModal
        open={openModal}
        product={
          selectedProduct
            ? {
                id:
                  selectedProduct.id,

                product_code:
                  selectedProduct.product_code,

                product_name:
                  selectedProduct.product_name,

                category:
                  selectedProduct.category ??
                  undefined,

                brand:
                  selectedProduct.brand ??
                  undefined,

                hsn_code:
                  selectedProduct.hsn_code ??
                  undefined,

                unit:
                  selectedProduct.unit ??
                  undefined,

                purchase_price:
                  selectedProduct.purchase_price,

                selling_price:
                  selectedProduct.selling_price,

                opening_stock:
                  selectedProduct.opening_stock,

                current_stock:
                  selectedProduct.current_stock,

                minimum_stock:
                  selectedProduct.minimum_stock,

                gst_percentage:
                  selectedProduct.gst_percentage,

                product_status:
                  selectedProduct.product_status ??
                  undefined,

                description:
                  selectedProduct.description ??
                  undefined,
              }
            : null
        }
        onClose={
          handleProductModalClose
        }
        onSuccess={
          handleProductSuccess
        }
      />

      {/* IMPORT MODAL */}
      {openImportModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Import Products from Excel
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload Excel or CSV to add new products.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseImport
                }
                disabled={
                  importLoading
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              >
                <X size={20} />
              </button>

            </div>

            {/* Modal Body */}
            <div className="space-y-5 px-6 py-5">

              {/* Info */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <FileSpreadsheet
                    size={20}
                    className="shrink-0 text-blue-600"
                  />

                  <div>

                    <h3 className="text-sm font-semibold text-blue-900">
                      Excel Import
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-blue-800">
                      Product Name is required.
                      Product Code from Excel is
                      ignored and AGS-ERP generates
                      a new Product Code.
                    </p>

                  </div>

                </div>

              </div>

              {/* Template */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div>

                  <div className="text-sm font-semibold text-slate-800">
                    Need a template?
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Download the CSV template.
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handleDownloadTemplate
                  }
                  disabled={
                    importLoading
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Download
                    size={15}
                  />

                  Download Template
                </button>

              </div>

              {/* Upload Area */}
              {!selectedExcelFile ? (

                <div
                  onDragOver={
                    handleDragOver
                  }
                  onDragLeave={
                    handleDragLeave
                  }
                  onDrop={handleDrop}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 bg-slate-50 hover:border-blue-400"
                  }`}
                >

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                    <Upload
                      size={25}
                    />

                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    Drop your Excel file here
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    or click to browse
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    .xlsx, .xls or .csv · Maximum 10 MB
                  </p>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={
                      handleExcelFile
                    }
                    className="hidden"
                  />

                </div>

              ) : (

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">

                        <FileSpreadsheet
                          size={21}
                        />

                      </div>

                      <div className="min-w-0">

                        <div className="truncate text-sm font-semibold text-emerald-900">
                          {
                            selectedExcelFile.name
                          }
                        </div>

                        <div className="mt-1 text-xs text-emerald-700">
                          {(
                            selectedExcelFile.size /
                            1024
                          ).toFixed(1)}{" "}
                          KB
                        </div>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={
                        handleRemoveFile
                      }
                      disabled={
                        importLoading
                      }
                      className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-100"
                    >
                      <X size={18} />
                    </button>

                  </div>

                </div>

              )}

              {/* Supported Columns */}
              <div className="rounded-xl border border-slate-200">

                <div className="border-b border-slate-200 px-4 py-3">

                  <h3 className="text-sm font-semibold text-slate-800">
                    Supported Columns
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-2 p-4 text-xs text-slate-600 sm:grid-cols-2">

                  <div>
                    <strong>
                      Product Name
                    </strong>{" "}
                    *
                  </div>

                  <div>
                    Product Code
                  </div>

                  <div>
                    Category
                  </div>

                  <div>
                    Brand
                  </div>

                  <div>
                    Unit
                  </div>

                  <div>
                    Purchase Price
                  </div>

                  <div>
                    Selling Price
                  </div>

                  <div>
                    GST %
                  </div>

                  <div>
                    HSN/SAC
                  </div>

                  <div>
                    Opening Stock
                  </div>

                  <div>
                    Minimum Stock
                  </div>

                </div>

              </div>

              {/* Success */}
              {importMessage && (

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <div className="text-sm font-semibold text-emerald-800">
                    {
                      importMessage
                    }
                  </div>

                  {importResult && (

                    <div className="mt-3 grid grid-cols-3 gap-3">

                      <div className="rounded-lg bg-white p-3">

                        <div className="text-xs text-slate-500">
                          Imported
                        </div>

                        <div className="mt-1 text-lg font-bold text-emerald-700">
                          {
                            importResult.imported
                          }
                        </div>

                      </div>

                      <div className="rounded-lg bg-white p-3">

                        <div className="text-xs text-slate-500">
                          Skipped
                        </div>

                        <div className="mt-1 text-lg font-bold text-amber-600">
                          {
                            importResult.skipped
                          }
                        </div>

                      </div>

                      <div className="rounded-lg bg-white p-3">

                        <div className="text-xs text-slate-500">
                          Errors
                        </div>

                        <div className="mt-1 text-lg font-bold text-red-600">
                          {
                            importResult.errors.length
                          }
                        </div>

                      </div>

                    </div>

                  )}

                </div>

              )}

              {/* Error */}
              {importError && (

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <div className="text-sm font-semibold text-red-800">
                    {
                      importError
                    }
                  </div>

                </div>

              )}

              {/* Row Errors */}
              {importResult?.errors &&
                importResult.errors.length >
                  0 && (

                  <div className="rounded-xl border border-red-200">

                    <div className="border-b border-red-100 bg-red-50 px-4 py-3">

                      <h3 className="text-sm font-semibold text-red-800">
                        Import Errors
                      </h3>

                    </div>

                    <div className="max-h-48 overflow-y-auto p-3">

                      <div className="space-y-2">

                        {importResult.errors.map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={`${item.row}-${index}`}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                            >

                              <span className="font-semibold">
                                Row{" "}
                                {
                                  item.row
                                }:
                              </span>{" "}

                              {
                                item.message
                              }

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  </div>

                )}

            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  handleCloseImport
                }
                disabled={
                  importLoading
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {importMessage
                  ? "Close"
                  : "Cancel"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleImportExcel()
                }
                disabled={
                  !selectedExcelFile ||
                  importLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >

                {importLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload
                      size={17}
                    />
                    Import Products
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}