import { useState } from "react";
import {
  downloadJanitorPayrollReport,
  downloadLegalProfileReport,
  downloadMealExpenseReport,
  downloadPresenceAccommodationReport,
  validateMealLocks,
} from "../api";
import type { UnclosedMealLockItem } from "../types";

export function useReportHub() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStr = String(month + 1).padStart(2, "0");

  const firstDayOfMonth = `${year}-${monthStr}-01`;
  const lastDayObj = new Date(year, month + 1, 0);
  const lastDayOfMonth = `${year}-${monthStr}-${String(lastDayObj.getDate()).padStart(2, "0")}`;
  const todayStr = today.toISOString().split("T")[0];

  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [loadingLegal, setLoadingLegal] = useState(false);
  const [loadingPresence, setLoadingPresence] = useState(false);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingJanitor, setLoadingJanitor] = useState(false);
  const [mealStartDate, setMealStartDate] = useState(firstDayOfMonth);
  const [mealEndDate, setMealEndDate] = useState(todayStr);
  const [janitorStartDate, setJanitorStartDate] = useState(firstDayOfMonth);
  const [janitorEndDate, setJanitorEndDate] = useState(lastDayOfMonth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Missing meal locks state for warning modal
  const [missingLocks, setMissingLocks] = useState<UnclosedMealLockItem[] | null>(null);
  const [showLocksModal, setShowLocksModal] = useState(false);

  const handleDownloadJanitor = async () => {
    try {
      setLoadingJanitor(true);
      setErrorMessage(null);
      await downloadJanitorPayrollReport(janitorStartDate, janitorEndDate);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo chấm công & lương tạp vụ");
    } finally {
      setLoadingJanitor(false);
    }
  };

  const handleDownloadLegal = async () => {
    try {
      setLoadingLegal(true);
      setErrorMessage(null);
      await downloadLegalProfileReport(includeAttachments);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo pháp lý");
    } finally {
      setLoadingLegal(false);
    }
  };

  const handleDownloadPresence = async () => {
    try {
      setLoadingPresence(true);
      setErrorMessage(null);
      await downloadPresenceAccommodationReport();
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo hiện diện chỗ ở");
    } finally {
      setLoadingPresence(false);
    }
  };

  const handleDownloadMeal = async () => {
    try {
      setLoadingMeal(true);
      setErrorMessage(null);
      setMissingLocks(null);

      const validationRes = await validateMealLocks(mealStartDate, mealEndDate);
      if (validationRes.missing_dates && validationRes.missing_dates.length > 0) {
        setMissingLocks(validationRes.missing_dates);
        setShowLocksModal(true);
        return;
      }

      await downloadMealExpenseReport(mealStartDate, mealEndDate);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải báo cáo chi phí bữa ăn");
    } finally {
      setLoadingMeal(false);
    }
  };

  return {
    includeAttachments,
    setIncludeAttachments,
    loadingLegal,
    loadingPresence,
    loadingMeal,
    loadingJanitor,
    mealStartDate,
    setMealStartDate,
    mealEndDate,
    setMealEndDate,
    janitorStartDate,
    setJanitorStartDate,
    janitorEndDate,
    setJanitorEndDate,
    errorMessage,
    setErrorMessage,
    missingLocks,
    showLocksModal,
    setShowLocksModal,
    handleDownloadLegal,
    handleDownloadPresence,
    handleDownloadMeal,
    handleDownloadJanitor,
  };
}
