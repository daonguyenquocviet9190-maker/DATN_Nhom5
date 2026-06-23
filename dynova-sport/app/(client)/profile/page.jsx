'use client';
import './profile.css';
import React,{useEffect,useState} from 'react';
import {User,Mail,Phone,MapPin,Save,ShieldCheck,Package,Heart,Star} from 'lucide-react';

export default function ProfilePage(){
  const [fullName,setFullName]=useState('Khách hàng');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [address,setAddress]=useState('');
  const [isSaved,setIsSaved]=useState(false);

  useEffect(()=>{
    const name=localStorage.getItem('userDisplayName');
    if(name) setFullName(name);
  },[]);

  const profilePercent=[fullName,email,phone,address].filter(v=>v.trim()).length*25;

  const save=(e)=>{
    e.preventDefault();
    localStorage.setItem('userDisplayName',fullName);
    setIsSaved(true);
    setTimeout(()=>setIsSaved(false),1800);
  }

  const Input=({icon:Icon,label,type='text',value,onChange,placeholder})=>(
    <div className="field">
      <label>{label}</label>
      <div className="inputWrap">
        <Icon size={18}/>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}/>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="hero">
          <div className="avatar"><User size={36}/></div>
          <div className="heroText">
            <h1>{fullName}</h1>
            <span className="badge">Premium Member</span>
            <p>Quản lý thông tin tài khoản Dynova Sport</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><Package/><h3>14</h3><span>Đơn hàng</span></div>
          <div className="stat"><Heart/><h3>26</h3><span>Yêu thích</span></div>
          <div className="stat"><Star/><h3>2540</h3><span>Điểm</span></div>
        </div>

        <div className="progressBox">
          <div className="progressTop">
            <span>Hoàn thiện hồ sơ</span>
            <b>{profilePercent}%</b>
          </div>
          <div className="bar"><div className="fill" style={{width:`${profilePercent}%`}}/></div>
        </div>

        {isSaved && <div className="toast"><ShieldCheck size={18}/> Hồ sơ đã được cập nhật.</div>}

        <form onSubmit={save}>
          <div className="grid">
            <Input icon={User} label="Họ và tên" value={fullName}
              onChange={e=>setFullName(e.target.value)} placeholder="Nhập họ tên"/>
            <Input icon={Mail} label="Email" type="email" value={email}
              onChange={e=>setEmail(e.target.value)} placeholder="example@gmail.com"/>
            <Input icon={Phone} label="Số điện thoại" value={phone}
              onChange={e=>setPhone(e.target.value)} placeholder="09xxxxxxxx"/>
            <Input icon={MapPin} label="Địa chỉ" value={address}
              onChange={e=>setAddress(e.target.value)} placeholder="Địa chỉ nhận hàng"/>
          </div>

          <button className="saveBtn">
            <Save size={18}/> Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
}
