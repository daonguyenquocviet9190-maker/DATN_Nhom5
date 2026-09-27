"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Landmark,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  clearBuyNowItems,
  clearCart,
  getBuyNowItems,
  getCart,
  getCurrentUser,
  getSelectedCartKeys,
  saveCart,
  saveSelectedCartKeys,
} from "@/utils/shopStorage";

import {
  calculateShippingFee,
  createCheckoutOrder,
} from "@/services/checkout.service";

import {
  getShippingProvinces,
  getShippingDistricts,
  getShippingWards,
} from "@/services/address.service";

import { getProfile } from "@/services/profile.service";
import { getSavedAddresses } from "@/services/saved-address.service";
import { apiFetch } from "@/services/api";
const paymentMethods = [
  {
    id: "COD",
    name: "Thanh toán khi nhận hàng",
    icon: Banknote,
    desc: "Khách thanh toán sau khi nhận và kiểm tra kiện hàng.",
  },
  {
    id: "BANK",
    name: "Chuyển khoản ngân hàng",
    icon: Landmark,
    desc: "Tạo đơn trước, sau đó chuyển sang trang QR để thanh toán.",
  },
];

function isEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, ""));
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        {children}
      </div>

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buyNowMode = searchParams ? searchParams.get("mode") === "buy_now" : false;

  const [items, setItems] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isErrorCoupon, setIsErrorCoupon] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const voucherDropdownRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [currentUser, setCurrentUser] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState("");
  const addressRequestId = useRef(0);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  const [shippingFee, setShippingFee] = useState(null);
  const [shippingMessage, setShippingMessage] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);
  const [successOrderAmount, setSuccessOrderAmount] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    provinceCode: "",
    province: "",
    districtCode: "",
    district: "",
    wardCode: "",
    ward: "",
    address: "",
    note: "",
  });

  const selectedSavedAddress = useMemo(() => {
    return (
      savedAddresses.find(
        (savedAddress) => String(savedAddress.id) === String(selectedAddressId)
      ) || null
    );
  }, [savedAddresses, selectedAddressId]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [items]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (voucherDropdownRef.current && !voucherDropdownRef.current.contains(event.target)) {
        setShowVoucherDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAvailableVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const data = await apiFetch("/vouchers", { auth: false });
      const list = Array.isArray(data) ? data : data?.data || [];
      const activeVouchers = list.filter((v) => v.is_active === 1 || v.is_active === true);
      setAvailableVouchers(activeVouchers);
    } catch (err) {
      console.error("Không thể tải danh sách mã giảm giá:", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    const syncCart = () => {
      const cartItems = buyNowMode ? getBuyNowItems() : getCart();
      const selected = buyNowMode ? [] : getSelectedCartKeys();

      const filtered = buyNowMode
        ? cartItems
        : cartItems.filter((item) => {
            const key = String(item?.key || item?.id || item?.product_id || "");
            return selected.includes(key);
          });

      setItems(filtered);
    };

    syncCart();
    const user = getCurrentUser();

    setCurrentUser(user || null);
    window.addEventListener("dynova:cart", syncCart);

    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      }));
    }

    const urlCoupon = searchParams ? searchParams.get("coupon") : null;
    const savedCoupon = urlCoupon || localStorage.getItem("applied_coupon") || "";

    if (savedCoupon) {
      setCouponInput(savedCoupon);
    }

    fetchAvailableVouchers();

    return () => window.removeEventListener("dynova:cart", syncCart);
  }, [searchParams]);

  useEffect(() => {
    if (subtotal > 0 && couponInput) {
      verifyCoupon(couponInput, subtotal);
    }
  }, [subtotal]);

  const verifyCoupon = async (codeToVerify, currentSubtotal) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) return;

    setIsApplyingCoupon(true);
    setCouponMessage("");

    try {
      // /vouchers/apply là route cần đăng nhập. Dùng apiFetch để tự gửi
      // Bearer token thay vì fetch thuần khiến voucher luôn bị 401.
      const data = await apiFetch("/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({
          code: cleanCode,
          coupon: cleanCode,
          cart_total: currentSubtotal,
          subtotal: currentSubtotal,
        }),
      });

      const discountVal =
        data?.data?.discount_amount ?? data?.data?.discount_value ?? data?.discount ?? 0;

      setAppliedCoupon(cleanCode);
      setDiscountAmount(Number(discountVal));
      setCouponMessage(data?.message || "Áp dụng mã giảm giá thành công!");
      setIsErrorCoupon(false);

      localStorage.setItem("applied_coupon", cleanCode);
      localStorage.setItem("discount_amount", String(discountVal));
    } catch (error) {
      removeCouponState();
      setCouponMessage(
        error?.data?.message ||
          error?.message ||
          "Không thể kiểm tra mã giảm giá. Vui lòng thử lại."
      );
      setIsErrorCoupon(true);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCouponState = () => {
    setAppliedCoupon("");
    setCouponInput("");
    setDiscountAmount(0);
    setCouponMessage("");
    setIsErrorCoupon(false);
    localStorage.removeItem("applied_coupon");
    localStorage.removeItem("discount_amount");
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      removeCouponState();
      setCouponMessage("Vui lòng nhập mã giảm giá.");
      setIsErrorCoupon(true);
      return;
    }
    verifyCoupon(couponInput, subtotal);
  };

  const handleSelectVoucherFromDropdown = (voucherCode) => {
    setCouponInput(voucherCode);
    setShowVoucherDropdown(false);
    verifyCoupon(voucherCode, subtotal);
  };

  useEffect(() => {
    let mounted = true;

    async function loadAddressData() {
      try {
        setAddressLoading(true);
        setAddressError("");

        const data = await getShippingProvinces();
        if (!mounted) return;
        setProvinces(data);

        let savedProfile = null;
        let addressBook = [];

        try {
          [savedProfile, addressBook] = await Promise.all([
            getProfile(),
            getSavedAddresses(),
          ]);
        } catch {
          try {
            savedProfile = await getProfile();
          } catch {
            savedProfile = null;
          }

          try {
            addressBook = await getSavedAddresses();
          } catch {
            addressBook = [];
          }
        }

        if (!mounted) return;
        setSavedAddresses(addressBook);

        const preferredAddress =
          addressBook.find((item) => Boolean(item.is_default)) ||
          addressBook[0] ||
          null;

        if (preferredAddress) {
          setSelectedAddressId(String(preferredAddress.id));
        }

        const profileUser = savedProfile?.user || null;
        const latestOrder = Array.isArray(savedProfile?.recent_orders)
          ? savedProfile.recent_orders[0] || null
          : null;

        const savedProvinceName =
          preferredAddress?.province || latestOrder?.province || profileUser?.province || "";
        const savedProvinceCode = preferredAddress?.province_code || "";
        const savedDistrictName =
          preferredAddress?.district || latestOrder?.district || profileUser?.district || "";
        const savedDistrictCode = preferredAddress?.district_code || "";
        const savedWardName =
          preferredAddress?.ward || latestOrder?.ward || profileUser?.ward || "";
        const savedWardCode = preferredAddress?.ward_code || "";
        const savedAddress =
          preferredAddress?.address_line || latestOrder?.address || profileUser?.address || "";

        const savedProvinceNormalized = normalizeText(savedProvinceName);
        const selectedProvince =
          data.find((item) => String(item.code) === String(savedProvinceCode)) ||
          data.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedProvinceNormalized &&
              (candidate === savedProvinceNormalized ||
                candidate.includes(savedProvinceNormalized) ||
                savedProvinceNormalized.includes(candidate))
            );
          }) ||
          null;

        const provinceDistricts = selectedProvince
          ? await getShippingDistricts(selectedProvince)
          : [];
        if (!mounted) return;

        const savedDistrictNormalized = normalizeText(savedDistrictName);
        const savedWardNormalized = normalizeText(savedWardName);

        const selectedDistrict =
          provinceDistricts.find(
            (item) => String(item.code) === String(savedDistrictCode)
          ) ||
          provinceDistricts.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedDistrictNormalized &&
              (candidate === savedDistrictNormalized ||
                candidate.includes(savedDistrictNormalized) ||
                savedDistrictNormalized.includes(candidate))
            );
          }) ||
          null;

        const districtWards = selectedDistrict
          ? await getShippingWards(selectedDistrict)
          : [];
        if (!mounted) return;

        const selectedWard =
          districtWards.find((item) => String(item.code) === String(savedWardCode)) ||
          districtWards.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedWardNormalized &&
              (candidate === savedWardNormalized ||
                candidate.includes(savedWardNormalized) ||
                savedWardNormalized.includes(candidate))
            );
          }) ||
          null;

        setDistricts(provinceDistricts);
        setWards(districtWards);

        setForm((prev) => ({
          ...prev,
          fullName:
            preferredAddress?.recipient_name ||
            latestOrder?.customer_name ||
            profileUser?.fullName ||
            profileUser?.full_name ||
            profileUser?.name ||
            prev.fullName,
          email:
            latestOrder?.customer_email ||
            latestOrder?.email ||
            profileUser?.email ||
            prev.email,
          phone:
            preferredAddress?.phone ||
            latestOrder?.customer_phone ||
            latestOrder?.phone ||
            profileUser?.phone ||
            prev.phone,
          provinceCode: selectedProvince ? String(selectedProvince.code) : "",
          province: selectedProvince?.name || savedProvinceName || "",
          districtCode: selectedDistrict?.code
            ? String(selectedDistrict.code)
            : "",
          district: selectedDistrict?.name || savedDistrictName || "",
          wardCode: selectedWard?.code ? String(selectedWard.code) : "",
          ward: selectedWard?.name || savedWardName || "",
          address: savedAddress || prev.address,
        }));
      } catch {
        setAddressError("Không tải được dữ liệu địa chỉ cũ.");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    }

    loadAddressData();
    return () => {
      mounted = false;
    };
  }, []);

  const applySavedAddress = async (savedAddress) => {
    if (!savedAddress) return;

    const requestId = ++addressRequestId.current;
    setSelectedAddressId(String(savedAddress.id));
    setAddressLoading(true);
    setAddressError("");
    setShippingFee(null);
    setShippingMessage("");

    try {
      const selectedProvince =
        provinces.find(
          (item) => String(item.code) === String(savedAddress.province_code)
        ) || null;

      const nextDistricts = selectedProvince
        ? await getShippingDistricts(selectedProvince)
        : [];

      if (addressRequestId.current !== requestId) return;

      const selectedDistrict =
        nextDistricts.find(
          (item) => String(item.code) === String(savedAddress.district_code)
        ) || null;

      const nextWards = selectedDistrict
        ? await getShippingWards(selectedDistrict)
        : [];

      if (addressRequestId.current !== requestId) return;

      const selectedWard =
        nextWards.find(
          (item) => String(item.code) === String(savedAddress.ward_code)
        ) || null;

      setDistricts(nextDistricts);
      setWards(nextWards);
      setForm((prev) => ({
        ...prev,
        fullName: savedAddress.recipient_name || prev.fullName,
        phone: savedAddress.phone || prev.phone,
        provinceCode: selectedProvince ? String(selectedProvince.code) : "",
        province: selectedProvince?.name || savedAddress.province || "",
        districtCode: selectedDistrict ? String(selectedDistrict.code) : "",
        district: selectedDistrict?.name || savedAddress.district || "",
        wardCode: selectedWard ? String(selectedWard.code) : "",
        ward: selectedWard?.name || savedAddress.ward || "",
        address: savedAddress.address_line || "",
      }));
      setShowSavedAddresses(false);
    } catch (error) {
      setAddressError(error?.message || "Không thể áp dụng địa chỉ đã lưu.");
    } finally {
      if (addressRequestId.current === requestId) {
        setAddressLoading(false);
      }
    }
  };

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemWeight = Number(item.weight || 300);
      return sum + itemWeight * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const isFreeShippingConfirmed =
    shippingFee !== null &&
    Number(shippingFee) === 0 &&
    /miễn phí|free shipping/i.test(String(shippingMessage || ""));

  const finalShipping =
    shippingFee === null
      ? 0
      : Number(shippingFee || 0);

  const finalTotal = Math.max(0, subtotal - discountAmount) + finalShipping;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (["fullName", "phone", "address"].includes(name)) {
      setSelectedAddressId("");
    }
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleProvinceChange = async (event) => {
    const requestId = ++addressRequestId.current;
    setSelectedAddressId("");
    const provinceCode = event.target.value;
    const province = provinces.find(
      (item) => String(item.code) === String(provinceCode)
    );

    setDistricts([]);
    setWards([]);
    setForm((prev) => ({
      ...prev,
      provinceCode,
      province: province?.name || "",
      districtCode: "",
      district: "",
      wardCode: "",
      ward: "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setAddressError("");
    setErrors((prev) => ({ ...prev, province: "", district: "", ward: "", submit: "" }));
    if (!province) {
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);
    try {
      const nextDistricts = await getShippingDistricts(province);
      if (addressRequestId.current === requestId) setDistricts(nextDistricts);
    } catch (error) {
      if (addressRequestId.current === requestId) {
        setAddressError(error?.message || "Không tải được danh sách quận/huyện.");
      }
    } finally {
      if (addressRequestId.current === requestId) setAddressLoading(false);
    }
  };

  const handleDistrictChange = async (event) => {
    const requestId = ++addressRequestId.current;
    setSelectedAddressId("");
    const districtCode = event.target.value;
    const district = districts.find(
      (item) => String(item.code) === String(districtCode)
    );

    setWards([]);
    setForm((prev) => ({
      ...prev,
      districtCode,
      district: district?.name || "",
      wardCode: "",
      ward: "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setAddressError("");
    setErrors((prev) => ({ ...prev, district: "", ward: "", submit: "" }));
    if (!district) {
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);
    try {
      const nextWards = await getShippingWards(district);
      if (addressRequestId.current === requestId) setWards(nextWards);
    } catch (error) {
      if (addressRequestId.current === requestId) {
        setAddressError(error?.message || "Không tải được danh sách phường/xã.");
      }
    } finally {
      if (addressRequestId.current === requestId) setAddressLoading(false);
    }
  };

  const handleWardChange = (event) => {
    setSelectedAddressId("");
    const wardCode = event.target.value;
    const ward = wards.find((item) => String(item.code) === String(wardCode));

    setForm((prev) => ({
      ...prev,
      wardCode,
      ward: ward?.name || "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setErrors((prev) => ({ ...prev, ward: "", submit: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ tên.";
    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!isPhone(form.phone)) {
      nextErrors.phone = "Số điện thoại chưa đúng định dạng.";
    }
    if (form.email && !isEmail(form.email)) nextErrors.email = "Email chưa đúng định dạng.";
    if (!form.province.trim()) nextErrors.province = "Vui lòng chọn tỉnh/thành phố.";
    if (!form.district.trim()) nextErrors.district = "Vui lòng chọn quận/huyện.";
    if (!form.ward.trim()) nextErrors.ward = "Vui lòng chọn phường/xã.";
    if (!form.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";

    const valid = Object.keys(nextErrors).length === 0;
    setErrors(
      valid
        ? {}
        : {
            ...nextErrors,
            submit: "Vui lòng kiểm tra các thông tin nhận hàng được đánh dấu.",
          }
    );
    return valid;
  };

  const resolveShippingFee = async ({ showValidationMessage = true } = {}) => {
    if (subtotal <= 0) {
      setShippingFee(0);
      setShippingMessage("");
      return 0;
    }

    if (!form.province || !form.district || !form.ward || !form.address?.trim()) {
      if (showValidationMessage) {
        setShippingMessage(
          "Vui lòng chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập Địa chỉ cụ thể."
        );
      }
      return null;
    }

    setShippingLoading(true);
    setShippingMessage("");

    try {
      const response = await calculateShippingFee({
        province: form.province,
        provinceCode: form.provinceCode,
        district: form.district,
        districtCode: form.districtCode,
        ward: form.ward,
        wardCode: form.wardCode,
        address: form.address.trim(),
        weight: totalWeight || 500,
        value: subtotal,
        items,
      });

      const rawFee = response?.data?.fee ?? response?.fee ?? 0;
      const feeVal = Number(rawFee);
      const isExplicitFreeShipping = Boolean(
        response?.data?.free_shipping ?? response?.free_shipping ?? false
      );

      if (!Number.isFinite(feeVal) || feeVal < 0) {
        throw new Error("Dịch vụ vận chuyển không trả về phí hợp lệ.");
      }

      if (feeVal === 0 && !isExplicitFreeShipping) {
        throw new Error(
          "GHN trả về phí vận chuyển 0 nhưng chưa xác nhận miễn phí vận chuyển."
        );
      }

      setShippingFee(feeVal);
      setShippingMessage(
        isExplicitFreeShipping
          ? "Đơn hàng được miễn phí vận chuyển."
          : response?.message || "Đã tính phí giao hàng thành công!"
      );
      return feeVal;
    } catch (error) {
      setShippingFee(null);
      setShippingMessage(
        error?.message ||
          "Không thể lấy phí vận chuyển. Vui lòng kiểm tra địa chỉ và thử lại."
      );
      return null;
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (
      addressLoading ||
      subtotal <= 0 ||
      !form.province ||
      !form.district ||
      !form.ward ||
      !form.address?.trim()
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      resolveShippingFee({ showValidationMessage: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    addressLoading,
    form.province,
    form.district,
    form.ward,
    form.address,
    subtotal,
    totalWeight,
  ]);

  const handleCalculateShipping = async () => {
    await resolveShippingFee();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length) return;

    if (!currentUser) {
      setErrors({ submit: "Bạn cần đăng nhập trước khi tạo đơn hàng." });
      setTimeout(() => router.push("/login?redirect=/checkout"), 900);
      return;
    }

    if (!validate()) return;

    setSubmitLoading(true);

    try {
      const checkedShippingFee = await resolveShippingFee({
        showValidationMessage: false,
      });

      if (checkedShippingFee === null) {
        setErrors({ submit: "Vui lòng kiểm tra lại địa chỉ nhận hàng." });
        return;
      }

      const checkedTotal = Math.max(0, subtotal - discountAmount) + Number(checkedShippingFee || 0);

      const payload = {
        customer: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        },
        shippingAddress: {
          province: form.province,
          provinceCode: form.provinceCode,
          district: form.district,
          districtCode: form.districtCode,
          ward: form.ward,
          wardCode: form.wardCode,
          address: form.address.trim(),
          note: form.note,
        },
        items: items.map((item) => ({
          product_id:
            item.product_id ??
            item.productId ??
            item.product?.id ??
            (item.source === "server" ? null : item.id),
          product_variant_id:
            item.product_variant_id ??
            item.variant_id ??
            item.variantId ??
            item.variant?.id ??
            null,
          quantity: Number(item.quantity || 1),
          name: item.name || item.product_name || item.product?.name || "Sản phẩm",
          image: item.image || item.image_url || item.product_image || item.product?.image || "",
          size: item.size || item.size_name || null,
          color: item.color || item.color_name || null,
        })),
        checkoutMode: buyNowMode ? "buy_now" : "cart",
        coupon: appliedCoupon,
        paymentMethod,
        subtotal,
        discount: discountAmount,
        shippingFee: checkedShippingFee,
        total: checkedTotal,
        weight: totalWeight,
      };

      const orderResponse = await createCheckoutOrder(payload);
      const order = orderResponse?.data || orderResponse?.order || orderResponse;
      if (!order?.id) throw new Error("Máy chủ chưa trả về mã đơn hàng.");

      const realOrderAmount = Number(
        order?.grand_total ??
        order?.total ??
        order?.total_price ??
        checkedTotal ??
        0
      );

      if (buyNowMode) {
        clearBuyNowItems();
      } else {
        const cartItems = getCart();
        const selectedKeys = new Set(items.map((item) => String(item?.key || item?.id || item?.product_id || "")));
        const remainingCart = cartItems.filter((item) => !selectedKeys.has(String(item?.key || item?.id || item?.product_id || "")));
        saveCart(remainingCart);
        saveSelectedCartKeys([]);
      }

      removeCouponState();
      window.dispatchEvent(new Event("dynova:storage"));
      setItems([]);
      setSuccessOrderAmount(realOrderAmount);

      if (paymentMethod === "BANK") {
        router.push(`/payment/bank/${order.id}`);
        return;
      }

      setSuccessOrder({
        ...order,
        total: realOrderAmount,
        grand_total: realOrderAmount,
      });
    } catch (error) {
      setErrors({
        submit: error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={38} />
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-950">Đặt hàng thành công</h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Mã đơn <b>{successOrder.order_code || successOrder.id || "DNV-ORDER"}</b> đã được tạo. Bạn có thể theo dõi trong lịch sử mua hàng.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-left text-sm font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Phương thức</span>
                <span>{paymentMethod}</span>
              </div>

              <div className="mt-2 flex justify-between">
                <span>Tổng tiền</span>
                <span className="text-orange-600">
                  {formatCurrency(successOrderAmount || successOrder?.grand_total || successOrder?.total || 0)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/orders"
                className="rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Theo dõi đơn hàng
              </Link>

              <Link
                href="/shop"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
              >
                Tiếp tục mua
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
            Checkout
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-slate-950">
            Đặt hàng & thanh toán
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Nhập thông tin nhận hàng, tính phí vận chuyển và chọn phương thức thanh toán.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <PackageCheck className="mx-auto text-orange-500" size={42} />
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Không có sản phẩm để thanh toán
            </h2>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-950">
                    Thông tin nhận hàng
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Kiểm tra lại thông tin người nhận và địa chỉ giao hàng.
                  </p>
                </div>

                <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setShowSavedAddresses((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-100/70"
                    aria-expanded={showSavedAddresses}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                        <MapPin size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-slate-950">Địa chỉ giao hàng</p>
                          {selectedSavedAddress?.is_default && (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-orange-600">
                              Mặc định
                            </span>
                          )}
                        </div>

                        {selectedSavedAddress ? (
                          <>
                            <p className="mt-1 truncate text-xs font-bold text-slate-700">
                              {selectedSavedAddress.recipient_name} · {selectedSavedAddress.phone}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                              {[
                                selectedSavedAddress.address_line,
                                selectedSavedAddress.ward,
                                selectedSavedAddress.district,
                                selectedSavedAddress.province,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {savedAddresses.length > 0
                              ? "Bấm để chọn nhanh một địa chỉ đã lưu."
                              : "Chưa có địa chỉ đã lưu. Bạn vẫn có thể nhập thủ công bên dưới."}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-[10px] font-black uppercase tracking-wider text-orange-600 sm:inline">
                        {selectedSavedAddress ? "Đổi địa chỉ" : "Chọn địa chỉ"}
                      </span>
                      <ChevronDown
                        size={18}
                        className={
                          "text-slate-400 transition-transform duration-200 " +
                          (showSavedAddresses ? "rotate-180" : "")
                        }
                      />
                    </div>
                  </button>

                  {showSavedAddresses && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {/* <p className="text-xs font-bold text-slate-500">
                          Chọn một địa chỉ, hệ thống sẽ tự điền thông tin và tính lại phí GHN.
                        </p> */}
                        <Link
                          href="/profile/addresses"
                          className="inline-flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600 transition hover:text-orange-700"
                        >
                          <MapPin size={14} />
                          Quản lý sổ địa chỉ
                        </Link>
                      </div>

                      {savedAddresses.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {savedAddresses.map((savedAddress) => {
                            const active =
                              String(selectedAddressId) === String(savedAddress.id);

                            return (
                              <button
                                key={savedAddress.id}
                                type="button"
                                onClick={() => applySavedAddress(savedAddress)}
                                className={
                                  "rounded-2xl border p-4 text-left transition " +
                                  (active
                                    ? "border-orange-400 bg-orange-50/40 ring-4 ring-orange-500/10"
                                    : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/20")
                                }
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-black text-slate-950">
                                      {savedAddress.recipient_name}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">
                                      {savedAddress.phone}
                                    </p>
                                  </div>
                                  {savedAddress.is_default && (
                                    <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                                  {[
                                    savedAddress.address_line,
                                    savedAddress.ward,
                                    savedAddress.district,
                                    savedAddress.province,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
                          <p className="text-xs font-bold text-slate-500">
                            Bạn chưa lưu địa chỉ nào.
                          </p>
                          <Link
                            href="/profile/addresses"
                            className="mt-2 inline-flex text-xs font-black text-orange-600 hover:text-orange-700"
                          >
                            + Thêm địa chỉ vào sổ địa chỉ
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Họ và tên" icon={User} error={errors.fullName}>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Nhập họ và tên"
                    />
                  </Field>

                  <Field label="Số điện thoại" icon={Phone} error={errors.phone}>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Nhập số điện thoại"
                    />
                  </Field>

                  <Field label="Email" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Email (không bắt buộc)"
                    />
                  </Field>

                  <Field label="Tỉnh / Thành phố" error={errors.province}>
                    <select
                      name="provinceCode"
                      value={form.provinceCode}
                      onChange={handleProvinceChange}
                      disabled={addressLoading}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {addressLoading ? "Đang tải địa chỉ..." : "Chọn Tỉnh / Thành phố"}
                      </option>
                      {provinces.map((province) => (
                        <option key={province.code} value={String(province.code)}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Quận / Huyện" error={errors.district}>
                    <select
                      name="districtCode"
                      value={form.districtCode}
                      onChange={handleDistrictChange}
                      disabled={addressLoading || !form.provinceCode}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Chọn Quận / Huyện</option>
                      {districts.map((district) => (
                        <option key={district.code} value={String(district.code)}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Phường / Xã" error={errors.ward}>
                    <select
                      name="wardCode"
                      value={form.wardCode}
                      onChange={handleWardChange}
                      disabled={addressLoading || !form.districtCode}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Chọn Phường / Xã</option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={String(ward.code)}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Địa chỉ cụ thể" error={errors.address}>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={(event) => {
                        handleChange(event);
                        setShippingFee(null);
                        setShippingMessage("");
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Số nhà, tên đường..."
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field label="Ghi chú đơn hàng">
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Ghi chú cho người giao hàng (không bắt buộc)"
                    />
                  </Field>
                </div>

                {addressError && (
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-500">
                    <AlertCircle size={14} className="shrink-0" />
                    {addressError}
                  </p>
                )}
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Phí vận chuyển</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Tính theo địa chỉ, trọng lượng và giá trị đơn hàng.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateShipping}
                    disabled={shippingLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:opacity-70"
                  >
                    {shippingLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Truck size={15} />
                    )}
                    Tính phí
                  </button>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-950">Giao hàng tiết kiệm</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Trọng lượng tạm tính: {totalWeight || 500}g
                      </p>
                    </div>

                    <p className="text-xl font-black text-orange-600">
                      {shippingFee === null
                        ? "CHƯA TÍNH"
                        : isFreeShippingConfirmed
                          ? "MIỄN PHÍ"
                          : formatCurrency(finalShipping)}
                    </p>
                  </div>

                  {shippingMessage && (
                    <p className="mt-3 flex items-start gap-2 text-xs font-bold text-slate-500">
                      <AlertCircle
                        size={14}
                        className="mt-0.5 shrink-0 text-orange-500"
                      />
                      {shippingMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-slate-950">
                  Phương thức thanh toán
                </h2>

                <div className="grid gap-3 md:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={
                          "rounded-3xl border p-4 text-left transition " +
                          (active
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50")
                        }
                      >
                        <Icon className="text-orange-500" size={22} />
                        <p className="mt-3 font-black text-slate-950">{method.name}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{method.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-slate-950">Đơn hàng</h2>

              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black text-slate-950">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.quantity} x {item.size || "Freesize"} / {item.color || "Mặc định"}
                      </p>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* KHU VỰC NHẬP VÀ CHỌN MÃ GIẢM GIÁ */}
              <div className="mt-6 border-t border-slate-100 pt-5 relative" ref={voucherDropdownRef}>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Tag
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onClick={() => setShowVoucherDropdown(true)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-black uppercase tracking-wider text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white cursor-pointer"
                      placeholder="Chọn hoặc nhập mã"
                      disabled={isApplyingCoupon}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:opacity-60"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Áp dụng"
                    )}
                  </button>
                </div>

                {showVoucherDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="p-2 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
                      <span>Mã giảm giá khả dụng</span>
                      <button 
                        type="button" 
                        onClick={() => setShowVoucherDropdown(false)}
                        className="text-slate-500 hover:text-slate-950"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {loadingVouchers ? (
                      <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400 gap-2">
                        <Loader2 size={14} className="animate-spin" /> Đang tải mã...
                      </div>
                    ) : availableVouchers.length === 0 ? (
                      <div className="py-4 text-center text-xs font-bold text-slate-400">
                        Hiện không có mã giảm giá nào.
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-1">
                        {availableVouchers.map((v) => (
                          <div
                            key={v.id || v.code}
                            onClick={() => handleSelectVoucherFromDropdown(v.code)}
                            className="group cursor-pointer rounded-xl p-2.5 transition hover:bg-orange-50 border border-transparent hover:border-orange-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-orange-600 text-xs tracking-wider">
                                {v.code}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500">
                                Chọn dùng →
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-0.5 line-clamp-1">
                              {v.title || v.description}
                            </p>
                            {v.min_order_value > 0 && (
                              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                Đơn tối thiểu: {formatCurrency(v.min_order_value)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-extrabold text-emerald-700">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      <span>Đã áp dụng: <b>{appliedCoupon}</b></span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCouponState}
                      className="text-emerald-500 transition hover:text-rose-500"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`mt-2.5 flex items-center gap-1.5 text-xs font-bold ${
                      isErrorCoupon ? "text-rose-500" : "text-emerald-600"
                    }`}
                  >
                    {isErrorCoupon && <AlertCircle size={14} className="shrink-0" />}
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600 border-t border-slate-100 pt-5">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-slate-950">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Vận chuyển</span>
                  <span className="text-slate-950">
                    {shippingFee === null
                      ? "Chưa tính"
                      : isFreeShippingConfirmed
                        ? "Miễn phí"
                        : formatCurrency(finalShipping)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Giảm giá ({appliedCoupon})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="font-black text-slate-950">Tổng thanh toán</span>
                  <span className="text-3xl font-black text-orange-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {errors.submit && (
                <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600">
                  {errors.submit}
                </p>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <Truck size={16} />
                    Tạo đơn hàng
                  </>
                )}
              </button>

              {/* <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                Hỗ trợ COD, chuyển khoản và online
              </p> */}
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fb] py-10 text-center font-bold text-slate-500">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}