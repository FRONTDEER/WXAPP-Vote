// pages/vote/votejs
// 项目，通过实时
// 用户，调用云函数 
// 投票，调用云函数，自己和项目票数自增

//=================虚拟数据源====================
var tempdata = {
      SIN: {
            title: "你的云开发使用经验如何？", //投票标题
            options: [ //投票选项
                  "小白：从来没有接触",
                  "入门：正在学习和尝试DEMO",
                  "了解：懂一些使用，敢于尝试小项目",
                  "掌握：具备开发线上项目的实力",
                  "熟悉：专业踩坑达人，多个线上项目"
            ],
            code: "SIN", //进入路径
            open: true, //允许投票
            one: false, //只允许一次
            number: { //投票数
                  0: 32,
                  1: 56,
                  2: 34,
                  3: 78,
                  4: 40
            }
      }
}

//=================页面逻辑区====================
var that = null

Page({
      data: {},
      onLoad(options) {
            that = this;
            //传入路径，则初始化项目
            if (options.code != null) {
                  that.code = options.code;
                  that.init_project();
            } else {
                  setInfo('T_OPEN')
            }
      },
      
      init_project() {
            //监听数据库投票项目，传入路径，用返回结果设置项目
                  //    用户数据为空，或当前没有投票数据（被重置），则初始化用户
            that.watch = wx.cloud.database().collection('vote_mess').where({
                  code:that.code
            }).watch({
                  onChange(res){
                        console.log(res)
                        if(res.docs.length != 0) {
                              let result = res.docs[0];
                              setProject(result);
                              if(that.data.user == null || result.number == null){
                                    that.init_user()
                              }
                        }else{
                              setInfo('T_OPEN')
                        }
                  },
                  onError(err){
                        setInfo('T_NET')
                  }
            })
      },

      init_user() {
            //取数据库中用户的投票信息
            netCall({
                  name: 'vote_init',
                  data:{
                        code: that.code
                  },
                  success(res){
                        setUser(res.result)
                  }
            })
            // 取本地缓存中用户该投票的投票数据
            //    若有，则以该值设置用户的投票数据
            //    若无，则以空参数设置
            setTimeout(function () {
                  let user = wx.getStorageSync(that.code)
                  if (user != null && user != '') {
                        setUser(user)
                  } else {
                        setUser([])
                  }
            }, 300)
      },
      
      vote(e) {
            //校验投票是否开启
            if (that.data.project.open != true) {
                  showModel('S_CLOSE')
                  return;
            }
            //校验单选投票是否已投过该选项
            if (that.data.user[e.currentTarget.dataset.i] == true) {
                  return;
            }
            //校验是否仅可投票一次，并且用户投票数据不为空对象
            if (that.data.project.one && JSON.stringify(that.data.user) != '{}') {
                  showModel('S_ONE')
                  return;
            }
            /*
                  开始正式单选投票
            */
            let tempvote = {
                  [e.currentTarget.dataset.i]: true
            }
            that.setData({
                  load: tempvote
            })
            setTimeout(function () {
                  wx.setStorageSync(that.code, tempvote)
                  setUser(tempvote)
            }, 300)
      },

      onShareAppMessage() {
            return {
                  title: `投票-${that.data.project.title}`,
                  path: `/pages/vote/vote?code=${that.code}`
            }
      }
})

//=================功能封装区====================
const INFO = {
      T_NET: '网络服务出现异常，请稍后再试\n如有问题请联系管理员处理',
      T_OPEN: '无法找到对应的投票项目，请重新尝试\n如有问题请联系管理员处理',
      S_ONE: ['项目设置只能投票一次', '提示'],
      S_CLOSE: ['当前不能投票，请等待投票开启', '提示'],
      S_LOAD: ['请等待本次投票操作完毕后再变更选择', '提示'],
      S_FAIL: ['在操作时遇到了一些网络问题，请稍后再试', '网络错误'],
      S_EMPTY: ['多选不能为空，请至少选择一个', '提示']
}

function setInfo(info) {
      that.setData({
            info: INFO[info]
      })
}

function setUser(user) {
      that.setData({
            user,
            load: null
      })
}

function setProject(project) {
      that.setData({
            project
      })
}

function setLoad(load) {
      that.setData({
            load
      })
}

function showModel(info) {
      wx.showModal({
            title: INFO[info][1],
            content: INFO[info][0],
            showCancel: false
      })
}

function netCall(obj) {
      if (that.netload != true) {
            that.netload = true;
            wx.cloud.callFunction({
                  name: obj.name,
                  data: (obj.data ? obj.data : {}),
                  success: (res) => {
                        typeof obj.success == "function" ? obj.success(res) : null
                  },
                  fail: (err) => {
                        showModel('S_FAIL')
                        console.log(err)
                        typeof obj.fail == "function" ? obj.fail(err) : null
                  },
                  complete() {
                        that.netload = false;
                  }
            })
      } else {
            showModel('S_LOAD')
      }
}