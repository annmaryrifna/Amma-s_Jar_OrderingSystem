
import { useState } from "react";
import "./css/CustomerComplaintModal.css";

interface CustomerComplaintModalProps {
    orderId: number;
    onClose: () => void;
    onSubmit: (
        orderId: number,
        subject: string,
        category: string,
        complaintMessage: string
    ) => Promise<void>;
}

const complaintCategories = [
    "Product Quality",
    "Order Issue",
    "Delivery Issue",
    "Payment Issue",
    "Packaging Issue",
    "Other",
];

const CustomerComplaintModal = ({
    orderId,
    onClose,
    onSubmit,
}: CustomerComplaintModalProps) => {
    const [category, setCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [complaintMessage, setComplaintMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!category || !subject.trim() || !complaintMessage.trim()) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            setSubmitting(true);

            await onSubmit(
                orderId,
                subject,
                category,
                complaintMessage
            );

            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="complaint-modal-overlay" onClick={onClose}>
            <div
                className="complaint-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="complaint-modal-header">
                    <div>
                        <h2>Submit a Complaint</h2>
                        <p>Booking #{orderId}</p>
                    </div>

                    <button
                        type="button"
                        className="complaint-close-button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {submitted ? (
                    <div className="complaint-success-message">
                        <h3>Complaint Submitted!</h3>
                        <p>
                            Thank you for bringing this to our attention.
                            We'll review your complaint.
                        </p>

                        <button type="button" onClick={onClose}>
                            Close
                        </button>
                    </div>
                ) : (
                    <form
                        className="complaint-modal-body"
                        onSubmit={handleSubmit}
                    >
                        <label>Complaint Category</label>

                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            required
                        >
                            <option value="">Select a category</option>

                            {complaintCategories.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        <label>Subject</label>

                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Enter complaint subject"
                            maxLength={150}
                            required
                        />

                        <label>Describe Your Complaint</label>

                        <textarea
                            value={complaintMessage}
                            onChange={e =>
                                setComplaintMessage(e.target.value)
                            }
                            placeholder="Please explain your issue..."
                            rows={5}
                            required
                        />

                        <button
                            type="submit"
                            className="submit-complaint-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit Complaint"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CustomerComplaintModal;
