const { register, findById } = require("../models/auth.model");

//console.log(register({username:"ss"}))

async function aa() {
    try {
        const result = await findById({username: "sfff"});
        console.log(result);
    } catch(err) {
        console.error('💥 Migration 실패:', err.message);
    }
    
}
aa();