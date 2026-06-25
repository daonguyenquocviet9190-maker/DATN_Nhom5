'use client';

import './profile.css';
import React, { useState, useEffect } from 'react';

import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  ShieldCheck,
  Package,
  Heart,
  Star,
  Lock,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  MapPinned
} from 'lucide-react';

export default function ProfilePage() {

  const [fullName, setFullName] = useState('Khách hàng');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {

    const savedName =
      localStorage.getItem('userDisplayName');

    if (savedName) {
      setFullName(savedName);
    }

  }, []);

  const profilePercent =
    [fullName, email, phone, address]
      .filter(item => item.trim())
      .length * 25;

  const handleSave = (e) => {

    e.preventDefault();

    localStorage.setItem(
      'userDisplayName',
      fullName
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);

  };

  return (

    <div className="profile-page">

      <div className="profile-container">

        {/* HERO SECTION */}

        <section className="profile-hero">

          <div className="hero-cover">

            <div className="hero-overlay"></div>

            <div className="hero-content">

              <div className="avatar-wrapper">

                <div className="profile-avatar">

                  <User size={55} />

                </div>

                <button
                  className="avatar-upload"
                  type="button"
                >
                  <Camera size={16} />
                </button>

              </div>

              <div className="hero-info">

                <div className="member-badge">
                  Premium Member
                </div>

                <h1>
                  {fullName}
                </h1>

                <p>
                  Quản lý tài khoản Dynova Sport,
                  theo dõi đơn hàng và cập nhật
                  thông tin cá nhân của bạn.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* STATS */}

        <section className="stats-section">

          <div className="stat-card">

            <div className="stat-icon">
              <Package size={22} />
            </div>

            <div>

              <h3>14</h3>

              <span>
                Đơn hàng đã mua
              </span>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <Heart size={22} />
            </div>

            <div>

              <h3>26</h3>

              <span>
                Sản phẩm yêu thích
              </span>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <Star size={22} />
            </div>

            <div>

              <h3>2540</h3>

              <span>
                Điểm thưởng
              </span>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              <ShoppingBag size={22} />
            </div>

            <div>

              <h3>4</h3>

              <span>
                Đơn đang giao
              </span>

            </div>

          </div>

        </section>

        {/* PROFILE COMPLETION */}

        <section className="profile-progress-card">

          <div className="progress-top">

            <div>

              <h3>
                Hoàn thiện hồ sơ
              </h3>

              <p>
                Hoàn thiện thông tin để nhận
                nhiều ưu đãi hơn.
              </p>

            </div>

            <div className="progress-percent">
              {profilePercent}%
            </div>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${profilePercent}%`
              }}
            />

          </div>

        </section>
        
        {/* QUICK ACTIONS */}

        <section className="quick-actions">

          <div className="action-card">

            <div className="action-left">

              <div className="action-icon">
                <ShoppingBag size={20} />
              </div>

              <div>
                <h4>Đơn hàng của tôi</h4>
                <p>
                  Theo dõi trạng thái đơn hàng
                </p>
              </div>

            </div>

            <ChevronRight size={18} />

          </div>

          <div className="action-card">

            <div className="action-left">

              <div className="action-icon">
                <Heart size={20} />
              </div>

              <div>
                <h4>Danh sách yêu thích</h4>
                <p>
                  Sản phẩm đã lưu
                </p>
              </div>

            </div>

            <ChevronRight size={18} />

          </div>

          <div className="action-card">

            <div className="action-left">

              <div className="action-icon">
                <MapPinned size={20} />
              </div>

              <div>
                <h4>Sổ địa chỉ</h4>
                <p>
                  Quản lý địa chỉ giao hàng
                </p>
              </div>

            </div>

            <ChevronRight size={18} />

          </div>

          <div className="action-card">

            <div className="action-left">

              <div className="action-icon">
                <CreditCard size={20} />
              </div>

              <div>
                <h4>Thanh toán</h4>
                <p>
                  Quản lý phương thức thanh toán
                </p>
              </div>

            </div>

            <ChevronRight size={18} />

          </div>

        </section>

        {/* MAIN GRID */}

        <div className="profile-main-grid">

          {/* LEFT */}

          <div className="profile-left">

            <div className="profile-card">

              <div className="card-header">

                <h2>
                  Thông tin cá nhân
                </h2>

              </div>

              {saved && (

                <div className="save-alert">

                  <ShieldCheck size={18} />

                  Cập nhật thông tin thành công

                </div>

              )}

              <form
                onSubmit={handleSave}
                className="profile-form"
              >

                <div className="input-grid">

                  <div className="input-group">

                    <label>
                      Họ và tên
                    </label>

                    <div className="input-box">

                      <User size={18} />

                      <input
                        type="text"
                        value={fullName}
                        onChange={(e)=>
                          setFullName(
                            e.target.value
                          )
                        }
                        placeholder="Nhập họ tên"
                      />

                    </div>

                  </div>

                  <div className="input-group">

                    <label>
                      Email
                    </label>

                    <div className="input-box">

                      <Mail size={18} />

                      <input
                        type="email"
                        value={email}
                        onChange={(e)=>
                          setEmail(
                            e.target.value
                          )
                        }
                        placeholder="example@gmail.com"
                      />

                    </div>

                  </div>

                  <div className="input-group">

                    <label>
                      Số điện thoại
                    </label>

                    <div className="input-box">

                      <Phone size={18} />

                      <input
                        type="text"
                        value={phone}
                        onChange={(e)=>
                          setPhone(
                            e.target.value
                          )
                        }
                        placeholder="09xxxxxxxx"
                      />

                    </div>

                  </div>

                  <div className="input-group">

                    <label>
                      Địa chỉ
                    </label>

                    <div className="input-box">

                      <MapPin size={18} />

                      <input
                        type="text"
                        value={address}
                        onChange={(e)=>
                          setAddress(
                            e.target.value
                          )
                        }
                        placeholder="Nhập địa chỉ"
                      />

                    </div>

                  </div>

                </div>

                <button
                  type="submit"
                  className="save-btn"
                >

                  <Save size={18} />

                  Lưu thay đổi

                </button>

              </form>

            </div>

            {/* SECURITY CARD */}

            <div className="profile-card">

              <div className="card-header">
                <h2>Bảo mật tài khoản</h2>
              </div>

              <div className="security-list">

                <div className="security-item">

                  <div className="security-left">

                    <div className="security-icon">
                      <Lock size={18} />
                    </div>

                    <div>

                      <h4>Đổi mật khẩu</h4>

                      <p>
                        Cập nhật mật khẩu định kỳ
                        để tăng tính bảo mật.
                      </p>

                    </div>

                  </div>

                  <ChevronRight size={18} />

                </div>

                <div className="security-item">

                  <div className="security-left">

                    <div className="security-icon">
                      <ShieldCheck size={18} />
                    </div>

                    <div>

                      <h4>Xác thực Email</h4>

                      <p>
                        Bảo vệ tài khoản bằng email.
                      </p>

                    </div>

                  </div>

                  <span className="verified">
                    Đã xác thực
                  </span>

                </div>

                <div className="security-item">

                  <div className="security-left">

                    <div className="security-icon">
                      <Phone size={18} />
                    </div>

                    <div>

                      <h4>Xác thực số điện thoại</h4>

                      <p>
                        Tăng cường bảo mật tài khoản.
                      </p>

                    </div>

                  </div>

                  <span className="verified">
                    Đã xác thực
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* RIGHT SIDEBAR */}

          <div className="profile-right">

            {/* RECENT ORDERS */}

            <div className="profile-card">

              <div className="card-header">

                <h2>
                  Đơn hàng gần đây
                </h2>

              </div>

              <div className="order-list">

                <div className="order-item">

                  <div>

                    <h4>#DH1024</h4>

                    <p>
                      Giày bóng đá Mercurial
                    </p>

                  </div>

                  <span className="status shipping">
                    Đang giao
                  </span>

                </div>

                <div className="order-item">

                  <div>

                    <h4>#DH1023</h4>

                    <p>
                      Áo thể thao Nike
                    </p>

                  </div>

                  <span className="status success">
                    Hoàn thành
                  </span>

                </div>

                <div className="order-item">

                  <div>

                    <h4>#DH1022</h4>

                    <p>
                      Balo tập luyện
                    </p>

                  </div>

                  <span className="status success">
                    Hoàn thành
                  </span>

                </div>

              </div>

            </div>

            {/* ACTIVITY */}

            <div className="profile-card">

              <div className="card-header">

                <h2>
                  Hoạt động gần đây
                </h2>

              </div>

              <div className="timeline">

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <h4>
                      Đặt hàng thành công
                    </h4>

                    <p>
                      Hôm nay · 09:30
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <h4>
                      Cập nhật hồ sơ
                    </h4>

                    <p>
                      Hôm qua · 15:45
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <h4>
                      Thêm sản phẩm yêu thích
                    </h4>

                    <p>
                      2 ngày trước
                    </p>

                  </div>

                </div>

                <div className="timeline-item">

                  <div className="timeline-dot"></div>

                  <div>

                    <h4>
                      Đổi mật khẩu
                    </h4>

                    <p>
                      1 tuần trước
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

