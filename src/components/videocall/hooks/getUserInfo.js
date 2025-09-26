const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('teacherUser');
    if (!userInfo) return null;
    const parsedInfo = JSON.parse(userInfo);
    parsedInfo.role = parsedInfo.role || 'student';
    return parsedInfo;
  } catch (error) {
    console.error('getUserInfo error:', error);
    return null;
  }
};
