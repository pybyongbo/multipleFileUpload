<template>
  <el-dialog title="修改用户信息" v-model="dialogVisible" width="600px" append-to-body>
    <el-form :model="form" :rules="rules" ref="userRef" label-width="80px">
      <el-row>

        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" maxlength="30" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入用户昵称" maxlength="30" />
          </el-form-item>
        </el-col>

      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="用户性别">
            <el-select v-model="form.gender" placeholder="请选择">
              <el-option label="保密" :value="0"></el-option>
              <el-option label="男" :value="1"></el-option>
              <el-option label="女" :value="2"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="激活状态">
             <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0"/>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ref, reactive, onMounted, watch, toRefs, watchEffect } from "vue";
  import { ElMessage } from "element-plus";

  const props = defineProps({
    open: {
      type: Boolean,
      default: false
    },
    detailInfo: {
      type: Object,
      default: () => ({})
    }
  });

  const emit = defineEmits(["handleSubmit","handleClose"]);

  // 创建本地的响应式变量来管理 dialog 状态
  const dialogVisible = ref(props.open);
  const data = reactive({
    form: {},

    rules: {
      userName: [{ required: true, message: "用户名称不能为空", trigger: "blur" }, { min: 2, max: 20, message: "用户名称长度必须介于 2 和 20 之间", trigger: "blur" }],
      nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
      password: [{ required: true, message: "用户密码不能为空", trigger: "blur" }, { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }, { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }],
      email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
      phonenumber: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }]
    }
  });

  const { form, rules } = toRefs(data);

  // 监听 props.open 变化，同步到本地状态
  watch(() => props.open, (newVal) => {
    dialogVisible.value = newVal;
  });

  // 监听本地 dialogVisible 变化，如果变为 false 则通知父组件
  watch(dialogVisible, (newVal) => {
    if (!newVal) {
      emit("handleClose");
    }
  });

  // 监听 detailInfo 变化来更新表单数据
  watchEffect(() => {
    if (props.detailInfo && Object.keys(props.detailInfo).length > 0) {
      // 使用解构赋值，避免直接修改 props
      form.value = {
        ...props.detailInfo,
        ...form.value
      };
    }
  });

  const submitForm = () => {
    const postData = {
      id: form.value.id,
      username: form.value.username,
      nickname: form.value.nickname,
      phonenumber: form.value.phonenumber,
      email: form.value.email,
      gender: form.value.gender,
      is_active: form.value.is_active
    };
    emit("handleSubmit", postData);
  };

  const cancel = () => {
    emit("handleClose");
  };
</script>

<style></style>