
const express = require("express");

const User = require("../models/User");
const PickupRequest = require("../models/PickupRequest");
const IssueReport = require("../models/IssueReport");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

const CATEGORY_COLORS = [
  "#059669",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function validWeight(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

/* =========================================
   GET /api/admin/dashboard
   Admin-only dashboard statistics
========================================= */
router.get(
  "/dashboard",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const now = new Date();

      const todayString = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      const monthDates = Array.from({ length: 6 }, (_, index) =>
        new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      );

      const monthKeys = monthDates.map(monthKey);
      const startDate = `${monthKeys[0]}-01`;

      const [
        totalRequests,
        completedRequests,
        pendingRequests,
        registeredUsers,
        allIssues,
        allPickups,
        completedWithWeight,
        recentPickups,
        monthlyCompletedPickups,
      ] = await Promise.all([
        PickupRequest.countDocuments({}),

        PickupRequest.countDocuments({ status: "Completed" }),

        PickupRequest.countDocuments({
          status: { $in: ["Pending", "Scheduled"] },
        }),

        User.countDocuments({ role: "user" }),

        IssueReport.find({}).select("status").lean(),

        PickupRequest.find({}).select("type").lean(),

        PickupRequest.find({
          status: "Completed",
          collectedWeightKg: { $ne: null },
        })
          .select("collectedWeightKg")
          .lean(),

        PickupRequest.find({})
          .sort({ createdAt: -1, _id: -1 })
          .limit(5)
          .populate("userId", "name email")
          .lean(),

        PickupRequest.find({
          status: "Completed",
          date: { $gte: startDate, $lte: todayString },
          collectedWeightKg: { $ne: null },
        })
          .select("date collectedWeightKg")
          .lean(),
      ]);

      const resolvedStatuses = new Set([
        "resolved",
        "closed",
        "completed",
      ]);

      const openIssues = allIssues.filter(
        (issue) =>
          !resolvedStatuses.has(
            String(issue.status || "pending").toLowerCase()
          )
      ).length;

      const weights = completedWithWeight
        .map((pickup) => pickup.collectedWeightKg)
        .filter(validWeight)
        .map(Number);

      const totalCollectedWeightKg =
        weights.length > 0
          ? Number(
              weights.reduce((sum, weight) => sum + weight, 0).toFixed(2)
            )
          : null;

      const monthlyTotals = Object.fromEntries(
        monthKeys.map((key) => [key, 0])
      );

      monthlyCompletedPickups.forEach((pickup) => {
        const key = String(pickup.date || "").slice(0, 7);

        if (
          Object.prototype.hasOwnProperty.call(monthlyTotals, key) &&
          validWeight(pickup.collectedWeightKg)
        ) {
          monthlyTotals[key] += Number(pickup.collectedWeightKg);
        }
      });

      const monthlyWaste = monthDates.map((date) => ({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        collected: Number(monthlyTotals[monthKey(date)].toFixed(2)),
      }));

      const categoryCounts = new Map();

      allPickups.forEach((pickup) => {
        const category =
          String(pickup.type || "Uncategorized").trim() || "Uncategorized";

        categoryCounts.set(
          category,
          (categoryCounts.get(category) || 0) + 1
        );
      });

      const totalCategorizedPickups = Array.from(
        categoryCounts.values()
      ).reduce((sum, count) => sum + count, 0);

      const wasteDistribution = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], index) => ({
          name,
          count,
          value:
            totalCategorizedPickups > 0
              ? Number(
                  ((count / totalCategorizedPickups) * 100).toFixed(1)
                )
              : 0,
          fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }));

      const requests = recentPickups.map((pickup) => ({
        id:
          pickup.pickupCode ||
          `ET-${String(pickup._id).slice(-8).toUpperCase()}`,
        citizen: pickup.userId?.name || "Unassigned",
        email: pickup.userId?.email || "",
        wasteType: pickup.type || "Uncategorized",
        quantity: validWeight(pickup.collectedWeightKg)
          ? `${Number(pickup.collectedWeightKg)} kg`
          : "Not recorded",
        collectedWeightKg: validWeight(pickup.collectedWeightKg)
          ? Number(pickup.collectedWeightKg)
          : null,
        date: pickup.date,
        status: pickup.status || "Pending",
      }));

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalRequests,
            completedRequests,
            pendingRequests,
            registeredUsers,
            totalCollectedWeightKg,
            recordedWeightCount: weights.length,
            totalIssueReports: allIssues.length,
            openIssues,
          },
          monthlyWaste,
          wasteDistribution,
          requests,
        },
      });
    } catch (error) {
      console.error("Admin dashboard API error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load admin dashboard data.",
      });
    }
  }
);

/* =========================================
   GET /api/admin/users
   Admin-only registered user directory
========================================= */
router.get("/users", protect, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("Admin users API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load registered users.",
    });
  }
});

module.exports = router;
