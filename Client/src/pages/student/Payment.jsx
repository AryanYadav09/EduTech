import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Footer from '../../components/student/Footer'
import Loading from '../../components/student/Loading'
import { AppContext } from '../../context/AppContext'

const Payment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    backendUrl,
    getToken,
    currency,
    userData,
    fetchUserData,
    fetchUserEnrolledCourses,
    fetchAllCourses,
  } = useContext(AppContext);

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const finalPrice = useMemo(() => {
    if (!courseData) return 0;
    return Number((courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2));
  }, [courseData]);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${courseId}`);
      if (data?.success) {
        setCourseData(data.course);
      } else {
        toast.error(data?.message || 'Could not fetch course');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const validatePaymentInput = () => {
    if (paymentMethod !== 'card') return true;
    if (!cardHolder.trim()) {
      toast.error('Please enter card holder name');
      return false;
    }
    if (cardNumber.replace(/\s/g, '').length < 12) {
      toast.error('Please enter a valid card number');
      return false;
    }
    if (!expiry.trim()) {
      toast.error('Please enter expiry date');
      return false;
    }
    if (cvv.trim().length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    return true;
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!userData) {
      toast.error('Please login to continue');
      return;
    }
    if (!validatePaymentInput()) return;

    try {
      setProcessingPayment(true);
      const token = await getToken();
      const purchaseResponse = await axios.post(
        `${backendUrl}/api/course/purchase`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!purchaseResponse.data?.success) {
        toast.error(purchaseResponse.data?.message || 'Could not create purchase');
        return;
      }

      const confirmResponse = await axios.post(
        `${backendUrl}/api/course/purchase/confirm`,
        {
          purchaseId: purchaseResponse.data.purchaseId,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (confirmResponse.data?.success) {
        toast.success(confirmResponse.data.message || 'Payment successful');
        await Promise.all([
          fetchUserData(),
          fetchUserEnrolledCourses(),
          fetchAllCourses(),
        ]);
        navigate(`/player/${courseId}`);
      } else {
        toast.error(confirmResponse.data?.message || 'Payment failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (!userData || !courseData) return;
    const alreadyEnrolled = userData.enrolledCourses?.some((id) => id.toString() === courseData._id);
    if (alreadyEnrolled) {
      navigate(`/player/${courseData._id}`);
    }
  }, [userData, courseData, navigate]);

  if (loading) return <Loading />;
  if (!courseData) return <p className='pt-24 px-8'>Course not found</p>;

  return (
    <>
      <div className='min-h-screen section-shell px-4 sm:px-10 md:px-14 lg:px-24 pt-24 pb-12'>
        <h1 data-animate="heading" className='text-3xl font-semibold text-slate-900'>Course Payment</h1>
        <p data-animate="text" className='text-sm animate-copy pt-2'>Complete payment to enroll in this course.</p>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8'>
          <div data-animate="card" className='lg:col-span-7 modern-card bg-white p-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Payment Gateway</h2>
            <p className='text-sm animate-copy pt-1'>Choose payment method and complete your transaction.</p>

            <div className='pt-5 flex flex-wrap gap-3'>
              {[
                { id: 'card', label: 'Card' },
                { id: 'upi', label: 'UPI' },
                { id: 'netbanking', label: 'Net Banking' },
                { id: 'wallet', label: 'Wallet' },
              ].map((method) => (
                <button
                  key={method.id}
                  type='button'
                  onClick={() => setPaymentMethod(method.id)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all duration-300 ${paymentMethod === method.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <form className='pt-6 space-y-4' onSubmit={handlePayment}>
              {paymentMethod === 'card' && (
                <>
                  <div className='flex flex-col gap-1'>
                    <label className='text-sm text-gray-700'>Card Holder Name</label>
                    <input
                      type='text'
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder='Aryan Yadav'
                      className='outline-none py-2.5 px-3 rounded border border-gray-300'
                    />
                  </div>

                  <div className='flex flex-col gap-1'>
                    <label className='text-sm text-gray-700'>Card Number</label>
                    <input
                      type='text'
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder='1234 5678 9012 3456'
                      className='outline-none py-2.5 px-3 rounded border border-gray-300'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div className='flex flex-col gap-1'>
                      <label className='text-sm text-gray-700'>Expiry</label>
                      <input
                        type='text'
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder='MM/YY'
                        className='outline-none py-2.5 px-3 rounded border border-gray-300'
                      />
                    </div>

                    <div className='flex flex-col gap-1'>
                      <label className='text-sm text-gray-700'>CVV</label>
                      <input
                        type='password'
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder='***'
                        className='outline-none py-2.5 px-3 rounded border border-gray-300'
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod !== 'card' && (
                <div className='rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600 bg-gray-50'>
                  You selected <span className='font-medium capitalize'>{paymentMethod}</span>. Click confirm payment to simulate secure gateway authorization.
                </div>
              )}

              <button
                type='submit'
                disabled={processingPayment}
                data-animate="button"
                className='modern-btn w-full text-white py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {processingPayment ? 'Processing Payment...' : `Pay ${currency}${finalPrice}`}
              </button>
            </form>
          </div>

          <div data-animate="card" className='lg:col-span-5 modern-card bg-white p-6 h-fit'>
            <h2 className='text-xl font-semibold text-gray-900'>Order Summary</h2>

            <div className='pt-4 flex items-start gap-4'>
              <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className='w-24 h-16 object-cover rounded-md' />
              <div>
                <p className='font-medium text-gray-900'>{courseData.courseTitle}</p>
                <p className='text-sm text-gray-500'>by {courseData.educator?.name || 'Educator'}</p>
              </div>
            </div>

            <div className='pt-5 space-y-2 text-sm'>
              <div className='flex items-center justify-between text-gray-600'>
                <span>Original Price</span>
                <span>{currency}{courseData.coursePrice}</span>
              </div>
              <div className='flex items-center justify-between text-green-600'>
                <span>Discount ({courseData.discount}%)</span>
                <span>- {currency}{((courseData.discount * courseData.coursePrice) / 100).toFixed(2)}</span>
              </div>
              <div className='h-px bg-gray-200 my-2'></div>
              <div className='flex items-center justify-between font-semibold text-gray-900 text-base'>
                <span>Total Payable</span>
                <span>{currency}{finalPrice}</span>
              </div>
            </div>

            {courseData.courseIncludes?.length > 0 && (
              <div className='pt-6'>
                <p className='font-medium text-gray-900'>You will get</p>
                <ul className='pt-2 list-disc ml-5 text-sm text-gray-600 space-y-1'>
                  {courseData.courseIncludes.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Payment
