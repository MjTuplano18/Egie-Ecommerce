import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BundleReviews = ({ bundle }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    setUserRole(userData?.role || "customer");
  }, []);

  useEffect(() => {
    loadReviews();
  }, [bundle?.id]);

  const loadReviews = async () => {
    if (!bundle?.id) return;

    try {
      setLoadingReviews(true);
      const response = await axios.get(`/api/bundles/${bundle.id}/reviews/`);
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.comment) {
      toast.error("Please provide both a rating and comment");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Please sign in to submit a review");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `/api/bundles/${bundle.id}/reviews/`,
        {
          rating: newReview.rating,
          review: newReview.comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Review submitted successfully");
      setNewReview({ rating: 0, comment: "" });
      setDialogOpen(false);
      await loadReviews();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to submit review";
      toast.error(errorMsg);

      if (error.response?.status === 400 && error.response?.data?.error === "already_reviewed") {
        toast.error("You have already reviewed this bundle");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await axios.delete(`/api/bundles/reviews/${reviewId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Review deleted successfully");
      await loadReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Customer Reviews</h2>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={isSubmitting}
        >
          {reviews.length === 0 ? "Be the first to review" : "Write a Review"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Write a Review for {bundle?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2">Rating</p>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() =>
                      setNewReview({ ...newReview, rating: star })
                    }
                    className={`cursor-pointer text-2xl ${
                      star <= newReview.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="What did you like or dislike?"
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Post Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loadingReviews ? (
        <p>Loading reviews...</p>
      ) : (
        <div className="space-y-4 mt-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border p-4 rounded bg-gray-50 shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{review.user_name}</p>
                    <p className="text-yellow-400">
                      {"★".repeat(review.rating)}
                      {Array.from({ length: 5 - review.rating }).map((_, i) => (
                        <span key={i} className="text-gray-300">☆</span>
                      ))}
                    </p>
                    <p className="mt-2">{review.review}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {(userRole === "admin" || review.is_owner) && (
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews yet for this bundle.</p>
          )}
        </div>
      )}
    </>
  );
};

export default BundleReviews;