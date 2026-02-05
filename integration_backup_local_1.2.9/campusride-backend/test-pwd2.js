import bcrypt from 'bcryptjs';

const storedHash = '$2b$12$6vH..at7qIzO2Z1XhWqgYu8/86OoAZKbQyt4uest7JA81odV5bFTK';
const pwd = 'Zr010930';

const match = await bcrypt.compare(pwd, storedHash);
console.log('密码 Zr010930 匹配:', match);
