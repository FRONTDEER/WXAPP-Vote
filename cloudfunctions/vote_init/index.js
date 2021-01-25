// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
      env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
      const openid = cloud.getWXContext().OPENID
      const result = (await db.collection('vote_user').where({
            openid:openid
      }).get()).data;
      //获取用户该投票的投票信息
      //    用户无任何数据，创建用户初始信息，
      //          无该投票信息，则返回空对象
      if(result.length != 0){
            const code = event.code;
            let project = result[0].project[code];
            return project?project:{}
      }
      else{
            await db.collection('vote_user').add({
                  data:{
                        openid: openid,
                        project:{}
                  }
            })
      }
}