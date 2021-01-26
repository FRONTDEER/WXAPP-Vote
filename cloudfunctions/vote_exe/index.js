// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
      env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
      const openid = cloud.getWXContext().OPENID

      const result = (await db.collection('vote_user').where({
            openid: openid
      }).get()).data;

      //对项目投票,对用户数据保存
      //    获取用户该投票的投票信息
      //          对比本次投票和上一次的投票数据
      if (result.length != 0) {
            //投票前处理
            const code = event.code;
            let project = result[0].project[code]; //用户上次投票的选择
            let newData = event.select; //用户本次投票的选择
            let diff = {} //两次投票的差值

            //先把本次投票加上
            for (let i in newData) {
                  diff[i] = _.inc(1)
            }
            //和上次投票对比 
            //    相同的选项，则不对总投票操作(删除前一步的加一操作)
            //    不同的选项，则减去上次投票的选项
            for (let i in project) {
                  if (diff[i]) delete diff[i]
                  else diff[i] = _.inc(-1)
            }
            //全部相同，则直接返回
            if(Object.keys(diff).length == 0)
                  return newData
            //对用户的数据操作
            await db.collection('vote_user').where({
                  openid: openid
            }).update({
                  data: {
                        project: {
                              [code]: _.set(newData)
                        }
                  }
            })
            //对投票操作
            await db.collection('vote_mess').where({
                  code: code
            }).update({
                  data: {
                        number: diff
                  }
            })

            return newData
      }
}