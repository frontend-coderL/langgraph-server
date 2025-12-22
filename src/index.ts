import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 主函数
 * 打印欢迎信息，验证环境变量是否正确加载
 */
const main = () => {
  const greeting = process.env.GREETING || 'Hello';
  const target = process.env.TARGET || 'World';
  
  console.log(`${greeting}, ${target}!`);
  console.log('TypeScript + Node.js 环境已成功搭建。');
};

main();
