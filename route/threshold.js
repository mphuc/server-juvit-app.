import express from 'express';
import axios from "axios";
import crypto from 'crypto';
import querystring from 'querystring';
import random from 'random-number';
import Usermodel from '../model/users.js';
import Walletmodel from '../model/wallet_transactions.js'
import Notification from '../model/notification.js';
import { randomUUID } from 'crypto'
import wallet_transactions from '../model/wallet_transactions.js';
import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary'
import { Route } from 'express';



const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
       auth: {
            user: 'hademylola@gmail.com',
            pass: 'sxwoxbbomiivppxf',
         },
    secure: true,
    });

const Router  = express.Router();

Router.post('/getautofee',(req,res)=>{

    let Api ="";
    let wallet_id = "";
    let secret = "";

    if(req.body.walletType === "BTC"){
            secret="3A84eebqYqeU3HaaXMcEAip8zBRS";
            Api="4PiVpdbyLJZatLBwR"
            wallet_id="194071"
    }
    else if(req.body.walletType === "USDT"){
        wallet_id="488433"
        secret="2Tzeo889sniN76LerbwjCSshkSZN"
        Api="491Wh19j3Ece4MJRz"
    }
        
    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function build(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

   
    var time = Math.floor(new Date().getTime() / 1000)
    // var postData = [{ "block_num": [1] }]
    const params = ['{"block_nums":[1,50,100]}'];

    var CHECKSUM = build(params,secret,time,rand);


    const parameters = {
        t:time,
        r:rand,
    }
    
    const get_request_args = querystring.stringify(parameters);
   
    const url = `https://demo.thresh0ld.com/v1/sofa/wallets/${wallet_id}/autofees?`+ get_request_args
    
    const new_params = {
        "block_nums": [1,50,100]
    }
   axios.post(url,new_params,{
        headers: {
            'Content-Type': 'application/json',
            'X-API-CODE':Api,
            'X-CHECKSUM':CHECKSUM,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
   })
   .then((result)=>{
       console.log(result.data['auto_fees'][0]['auto_fee'])
        
        res.send({
           "message":result.data,
            "status":true
        })
        
   })
   .catch((err)=>{
       console.log(err)
    //    res.send({
    //        "message":err,
    //        "status":false
    //    })
       res.status(403).send(err);
   })
})


Router.get('/activateusdtToken',async(req,res)=>{
    let result = await activate_token();
    res.send(result);
})

Router.get('/checkaddressvalidity',async (req,res)=>{
    let result = await CheckAddressValidity(req.body.address,req.body.type);
    
    res.send(result)
    // if(result.result[0].valid){

    //         res.send({'message':"Valid Address","address":result.result[0].address})

    // }
    // else{
    //     res.send({'message':"InValid Address","address":result.result[0].address})
    // }
    
})


Router.post('/incoming/depositcallback',(req,res)=>{
    console.log('Welcome Incoming CallBack')
    console.log(req.headers['x-checksum']);
    console.log(req.body);
    if(req.headers['x-checksum'] !== "undefined" || req.headers['x-checksum'] !== "" ){
        if(req.body.processing_state === 1){
            Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                if(err){
                    res.json({
                        'message':'An Error'+err,
                        'status':false
                    })
                }
                if(docs){

                }
                else{
                    Walletmodel.create({
                        type:req.body.type,
                        serial:req.body.serial,
                        order_id:req.body.order_id,
                        currency:req.body.currency,
                        txtid:req.body.txid,
                        block_height:req.body.block_height,
                        tindex:req.body.tindex,
                        vout_index:req.body.vout_index,
                        amount:req.body.amount,
                        fees:req.body.fees,
                        memo:req.body.memo,
                        broadcast_at:req.body.broadcast_at,
                        chain_at:req.body.chain_at,
                        from_address:req.body.from_address,
                        to_address:req.body.to_address,
                        wallet_id:req.body.wallet_id,
                        state:req.body.state,
                        confirm_blocks:req.body.confirm_blocks,
                        processing_state:req.body.processing_state,
                        decimal:req.body.decimal,
                        currency_bip44:req.body.currency_bip44,
                        token_address:req.body.token_address,
                        status:'Processing'
                    });
                    
                    console.log('1st Notification Saved',req.body)
                    // res.sendStatus(200);
                    
                    // res.json({
                    //     'message':'Transaction Completed',
                    //     'status':true,
                    //     'completed':true
                    // })
                }
            })

            
            
        }
        if(req.body.processing_state === 2){

            Walletmodel.findOne({txtid:req.body.txid},async function(err,docs){
                if(err){
                    res.json({
                        'message':err,
                        'status':false
                    })
                }
                if(docs){
                    if(docs.processing_state !== 2){
                        Walletmodel.create({
                            type:req.body.type,
                            serial:req.body.serial,
                            order_id:req.body.order_id,
                            currency:req.body.currency,
                            txtid:req.body.txid,
                            block_height:req.body.block_height,
                            tindex:req.body.tindex,
                            vout_index:req.body.vout_index,
                            amount:req.body.amount,
                            fees:req.body.fees,
                            memo:req.body.memo,
                            broadcast_at:req.body.broadcast_at,
                            chain_at:req.body.chain_at,
                            from_address:req.body.from_address,
                            to_address:req.body.to_address,
                            wallet_id:req.body.wallet_id,
                            state:req.body.state,
                            confirm_blocks:req.body.confirm_blocks,
                            processing_state:req.body.processing_state,
                            decimal:req.body.decimal,
                            currency_bip44:req.body.currency_bip44,
                            token_address:req.body.token_address,
                            status:'Transaction Completed'
                        });

                         let UpdateDepositAccount  = await Usermodel.findOneAndUpdate({'btc_wallet.address':req.body.to_address},{$inc:{'btc_wallet.$.balance':parseFloat(req.body.amount).toFixed(8)}}).exec();
                        if(UpdateDepositAccount){
                        //     let subject = "Failed Deposit Update onPremises"
                        //    await FailedUpdateEmail(req.body.to_address,req.body.txtid,subject);
                             console.log('Transaction Completed',req.body)
                             res.sendStatus(200);
                        }
                        else{
                            let subject = "Failed Deposit Update onPremises"
                            await FailedUpdateEmail(req.body.to_address,req.body.txtid,subject);
                            res.sendStatus(200);
                        }
                      
                        
                        
                    }
                    // console.log('Transaction Completed',req.body)
                    // res.sendStatus(200);
                }
                else{
                    console.log('Transaction Completed Already',req.body)
                    // res.sendStatus(200);
                    
                   
                }
            })
            
            // res.sendStatus(200);
            // res.json({
            //     'message':'Transaction Completed',
            //     'status':true,
            //     'completed':true
            // })
            
        }
        if(req.body.processing_state === -1){
            
            // res.sendStatus(200)
            if(req.body.state === 5){
                Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Failed'
                            });
                            

                            
                        }
                        console.log('Transaction Failed',req.body)
                        res.sendStatus(200);
                    }
                    else{
                        console.log('Transaction Failed',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
               
            }
            else if(req.body.state === 8 ){

                Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Cancelled'
                            });
                            
                            
                        }
                        console.log('Transaction Cancelled',req.body)
                        res.sendStatus(200);
                    }
                    else{
                        console.log('Transaction Cancelled',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
                
            }
            else if(req.body.state ===  10){

                Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Dropped'
                            });
                            
                            
                        }
                        console.log('Transaction Dropped',req.body)
                        res.sendStatus(200);
                    }
                    else{
                        console.log('Transaction Dropped',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })      
            }
            else{
                Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txtid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Unsuccessful'
                            });
                            
                            
                        }
                        console.log('Transaction Unsuccessful',req.body)
                        res.sendStatus(200);
                    }
                    else{
                        console.log('Transaction Unsuccessful',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
                


                res.json({
                    'message':'Transaction Unsuccessful',
                    'status':false,
                    'completed':false
                }) 
            }
            
            
        }
    }
    else{
        res.json({
            'message':'Forbidden',
            'status':false,
            'completed':false
        }) 
    }
   
    
})
Router.post('/incoming/withdrawalcallback',(req,res)=>{
    console.log('withdrawalcallback');
    
    console.log(req.headers['x-checksum']);
    console.log(req.body);
    if(req.headers['x-checksum'] !== "undefined" || req.headers['x-checksum'] !== "" ){
        if(req.body.processing_state === 1){
            Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                if(err){
                    res.json({
                        'message':'An Error'+err,
                        'status':false
                    })
                }
                if(docs){

                }
                else{
                    Walletmodel.create({
                        type:req.body.type,
                        serial:req.body.serial,
                        order_id:req.body.order_id,
                        currency:req.body.currency,
                        txtid:req.body.txid,
                        block_height:req.body.block_height,
                        tindex:req.body.tindex,
                        vout_index:req.body.vout_index,
                        amount:req.body.amount,
                        fees:req.body.fees,
                        memo:req.body.memo,
                        broadcast_at:req.body.broadcast_at,
                        chain_at:req.body.chain_at,
                        from_address:req.body.from_address,
                        to_address:req.body.to_address,
                        wallet_id:req.body.wallet_id,
                        state:req.body.state,
                        confirm_blocks:req.body.confirm_blocks,
                        processing_state:req.body.processing_state,
                        decimal:req.body.decimal,
                        currency_bip44:req.body.currency_bip44,
                        token_address:req.body.token_address,
                        status:'Processing'
                    });

                   

                    console.log('1st Notification Saved Widthrawal',req.body)
                    res.sendStatus(200);
                    
                    // res.json({
                    //     'message':'Transaction Completed',
                    //     'status':true,
                    //     'completed':true
                    // })
                }
            })

            
            
        }
        if(req.body.processing_state === 2){

            Walletmodel.findOne({txtid:req.body.txid},async function(err,docs){
                if(err){
                    res.json({
                        'message':err,
                        'status':false
                    })
                }
                if(docs){
                    if(docs.processing_state !== 2){

                        let newAmount;

                        if(req.body.currency === "BTC"){
                            newAmount = parseFloat(req.body.amount * 0.00000001).toFixed(8);
                        }

                        Walletmodel.create({
                            type:req.body.type,
                            serial:req.body.serial,
                            order_id:req.body.order_id,
                            currency:req.body.currency,
                            txtid:req.body.txid,
                            block_height:req.body.block_height,
                            tindex:req.body.tindex,
                            vout_index:req.body.vout_index,
                            amount:newAmount,
                            fees:req.body.fees,
                            memo:req.body.memo,
                            broadcast_at:req.body.broadcast_at,
                            chain_at:req.body.chain_at,
                            from_address:req.body.from_address,
                            to_address:req.body.to_address,
                            wallet_id:req.body.wallet_id,
                            state:req.body.state,
                            confirm_blocks:req.body.confirm_blocks,
                            processing_state:req.body.processing_state,
                            decimal:req.body.decimal,
                            currency_bip44:req.body.currency_bip44,
                            token_address:req.body.token_address,
                            status:'Transaction Completed'
                        });

                        Notification.create({
                            type:req.body.type,
                            orderid:req.body.orderid,
                            transfertype:'BlockChain Transfer',
                            asset:req.body.currency,
                            from_address:req.body.from_address,
                            to_address:req.body.to_address,
                            amount:req.body.amount,
                            status:'Transaction Completed',
                            read:'unread',
                            initiator:'sender',
                            senderaddress:req.body.orderid,
                            // senderaddress:req.body.from_address,
                        })
   
                    }
                    console.log('Transaction Completed',req.body)
                    res.sendStatus(200); 
                }
                else{
                    console.log('Transaction Completed Already',req.body)
                    res.sendStatus(200);
                    
                   
                }
            })
            
            // res.sendStatus(200);
            // res.json({
            //     'message':'Transaction Completed',
            //     'status':true,
            //     'completed':true
            // })
            
        }
        if(req.body.processing_state === -1){
            
            // res.sendStatus(200)
            if(req.body.state === 5){
                Walletmodel.findOne({txtid:req.body.txid},async function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Failed'
                            });
                            
                            
                        }
                        
                        let total = parseFloat(req.body.amount * 0.00000001).toFixed(8) + parseFloat(req.body.fees * 0.00000001).toFixed(8);
                        let Reversal  = await Usermodel.findOneAndUpdate({'btc_wallet.address':req.body.to_address},{$inc:{'btc_wallet.$.balance':parseFloat(total).toFixed(8)}}).exec();
                        console.log('Transaction Failed',req.body)
                        if(Reversal){
                            res.sendStatus(200);
                        }
                        else{
                            let subject = "Failed Reversal Update On Premises"
                            await FailedUpdateEmail(req.body.to_address,req.body.txtid,subject);
                            res.sendStatus(200);
                        }
                        
                    }
                    else{
                        console.log('Transaction Failed',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
               
            }
            else if(req.body.state === 8 ){

                Walletmodel.findOne({txtid:req.body.txid},async function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Cancelled'
                            });
                            
                            
                        }
                        let total = parseFloat(req.body.amount * 0.00000001).toFixed(8) + parseFloat(req.body.fees * 0.00000001).toFixed(8);
                        let Reversal  = await Usermodel.findOneAndUpdate({'btc_wallet.address':req.body.to_address},{$inc:{'btc_wallet.$.balance':parseFloat(total).toFixed(8)}}).exec();
                        console.log('Transaction Failed',req.body)
                        if(Reversal){
                            res.sendStatus(200);
                        }
                        else{
                            let subject = "Failed Reversal Update On Premises"
                            await FailedUpdateEmail(req.body.to_address,req.body.txtid,subject);
                            res.sendStatus(200);
                        }
                        
                    }
                    else{
                        console.log('Transaction Cancelled',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
                
            }
            else if(req.body.state ===  10){

                Walletmodel.findOne({txtid:req.body.txid},async function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Dropped'
                            });
                            
                            
                        }
                        let total = parseFloat(req.body.amount * 0.00000001).toFixed(8) + parseFloat(req.body.fees * 0.00000001).toFixed(8);
                        let Reversal  = await Usermodel.findOneAndUpdate({'btc_wallet.address':req.body.to_address},{$inc:{'btc_wallet.$.balance':parseFloat(total).toFixed(8)}}).exec();
                        console.log('Transaction Failed',req.body)
                        if(Reversal){
                            res.sendStatus(200);
                        }
                        else{
                            let subject = "Failed Reversal Update On Premises"
                            await FailedUpdateEmail(req.body.to_address,req.body.txtid,subject);
                            res.sendStatus(200);
                        }
                        
                    }
                    else{
                        console.log('Transaction Dropped',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })      
            }
            else{
                Walletmodel.findOne({txtid:req.body.txid},function(err,docs){
                    if(err){
                        res.json({
                            'message':err,
                            'status':false
                        })
                    }
                    if(docs){
                        if(docs.processing_state !== -1){
                            Walletmodel.create({
                                type:req.body.type,
                                serial:req.body.serial,
                                order_id:req.body.order_id,
                                currency:req.body.currency,
                                txtid:req.body.txtid,
                                block_height:req.body.block_height,
                                tindex:req.body.tindex,
                                vout_index:req.body.vout_index,
                                amount:req.body.amount,
                                fees:req.body.fees,
                                memo:req.body.memo,
                                broadcast_at:req.body.broadcast_at,
                                chain_at:req.body.chain_at,
                                from_address:req.body.from_address,
                                to_address:req.body.to_address,
                                wallet_id:req.body.wallet_id,
                                state:req.body.state,
                                confirm_blocks:req.body.confirm_blocks,
                                processing_state:req.body.processing_state,
                                decimal:req.body.decimal,
                                currency_bip44:req.body.currency_bip44,
                                token_address:req.body.token_address,
                                status:'Transaction Unsuccessful'
                            });
                            
                            
                        }
                        console.log('Transaction Unsuccessful',req.body)
                        res.sendStatus(200);
                    }
                    else{
                        console.log('Transaction Unsuccessful',req.body)
                        res.sendStatus(200);
                        
                       
                    }
                })
                


                res.json({
                    'message':'Transaction Unsuccessful',
                    'status':false,
                    'completed':false
                }) 
            }
            
            
        }
    }
    else{
        res.json({
            'message':'Forbidden',
            'status':false,
            'completed':false
        }) 
    }
})

Router.post('/check/customer/Address',middlewareVerify,async(req,res)=>{
    
    let receipentAddress = req.body.receipent_address;
    let wallet_type = req.body.wallet_type;
    // let jupitAddress = await checkJupitAddress(receipentAddress,wallet_type);
    let CheckAddressValidityVar = await CheckAddressValidity(receipentAddress,wallet_type);

    if(CheckAddressValidityVar[0] && CheckAddressValidityVar[1] ){
        console.log('Hello',CheckAddressValidityVar)
        let jupitAddress = await JupitCustomerCheck(receipentAddress,wallet_type);
        
        if(jupitAddress.length > 0){
            res.send('Internal Transfer')
        }
        else{
            res.send('BlockChain Transfer')
        }
    }
    else{
        console.log('Hello',CheckAddressValidityVar)
        res.status(403).send('Invalid Wallet Address');
    }
   
    
})

Router.post('/transfer/coin/',middlewareVerify,async(req,res)=>{
    const user_id = req.body.userid;
    const sender = req.body.senderaddress;
    const wallet_type = req.body.wallet_type;
    const amount = parseFloat(req.body.amount).toFixed(8);
    const recipentaddress = req.body.receipentaddress;
    const tranfertype = req.body.transfertype
    const networkFee = req.body.networkFee
    const block_average_fee = req.body.block_average;


    
    
    // console.log("sender",sender);
    // console.log("user_id",user_id);
    // console.log("wallet_type",wallet_type);
    // console.log("amount",amount);
    // console.log("reciepentaddress",recipentaddress);
//     console.log('BlockAverage',block_average_fee)
  
//    console.log(req.body);

 
    
    if(tranfertype === "Internal Transfer"){
        
        let SubFundToWallet = await SubFund(user_id,parseFloat(amount).toFixed(8),wallet_type,block_average_fee,sender,recipentaddress);
                        
        if(SubFundToWallet){
            
            let AddFundToWallet = await AddFund(recipentaddress,parseFloat(amount).toFixed(8),wallet_type);
            if(AddFundToWallet){

                // console.log('1',recipentaddress)
                // console.log('2',req.body.recipentaddress)
                Notification.create({
                    type:2,
                    orderid:sender,
                    transfertype:tranfertype,
                    asset:wallet_type,
                    from_address:sender,
                    to_address:recipentaddress,
                    amount:amount,
                    status:'Completed',
                    read:'unread',
                    initiator:'sender',
                    senderaddress:sender,
                })
                Notification.create({
                    type:1,
                    orderid:recipentaddress,
                    transfertype:tranfertype,
                    asset:wallet_type,
                    from_address:sender,
                    to_address:recipentaddress,
                    amount:amount,
                    status:'Completed',
                    read:'unread',
                    initiator:'receiver',
                    recipientaddress:recipentaddress,
                })
                res.send({
                    "Message":'Transaction Was Successful',
                })
            }
            else{
               
                res.status(403).send({
                    "Message":"Internal Server Error AddFund"+ AddFundToWallet,
                    
                })
            }
        }
        else{
           
            res.status(403).send({
                "message":"Internal Server Error SendFund"+ SubFundToWallet,
                
            })
        }
    }
    else if(tranfertype === "BlockChain Transfer"){
                let fee = parseFloat(block_average_fee * 226 * 0.00000001 ).toFixed(8);
                let totalAmount  = parseFloat(networkFee) + parseFloat(amount)
                
                
        let UpdateWalletBalances = await updateWalletBalance(user_id,parseFloat(totalAmount).toFixed(8),wallet_type,fee,sender,recipentaddress);
        if(UpdateWalletBalances){
            if(wallet_type === "BTC"){
                
                let WalletCallback =  await creditWalletAddress(user_id,sender,recipentaddress,wallet_type,parseFloat(fee).toFixed(8),parseFloat(amount).toFixed(8),block_average_fee)
                if(WalletCallback[1]){
                  
                    Notification.create({
                        type:2,
                        orderid:WalletCallback[2],
                        transfertype:tranfertype,
                        asset:wallet_type,
                        from_address:sender,
                        to_address:recipentaddress,
                        amount:amount,
                        status:'Processing',
                        read:'unread',
                        initiator:'sender',
                        senderaddress:sender,
                    })
                    
                    res.send({
                        "Message":"Transaction Initiated",
                        "Status":true
                    })
                }
                else{
                    console.log(WalletCallback[0]);
                    res.status(403).send("Internal Server Error..")
                    // res.json({
                    //     "Message":"Internal Server Error..",
                    //     "Status":false
                    // })
                }
            }

            if(wallet_type === "USDT"){
               
                
                let WalletCallback =  await creditWalletAddressUSDT(user_id,sender,recipentaddress,wallet_type,parseFloat(fee).toFixed(8),parseFloat(amount).toFixed(8),networkFee)
                if(WalletCallback[1]){
                  
                    Notification.create({
                        type:2,
                        orderid:WalletCallback[2],
                        transfertype:tranfertype,
                        asset:wallet_type,
                        from_address:sender,
                        to_address:recipentaddress,
                        amount:amount,
                        status:'Processing',
                        read:'unread',
                        initiator:'sender',
                        senderaddress:sender,
                    })
                    
                    res.send({
                        "Message":"Transaction Initiated",
                        "Status":true
                    })
                }
                else{
                    console.log(WalletCallback[0]);
                    res.status(403).send("Internal Server Error..")
                    // res.json({
                    //     "Message":"Internal Server Error..",
                    //     "Status":false
                    // })
                }
            }
            
        
        
        } 
        else{
            res.status(403).send("Internal Server Error.."+ UpdateWalletBalances)
            // res.json({
            //     "error":"InternalServerError...UpdateWallet "+ UpdateWalletBalances,
            //     "status":false,
            // })
        }

    }
    

})

Router.post('/notification/fetch',middlewareVerify,(req,res)=>{
    const addressBTC = req.body.addressBTC;
    const addressUSDT = req.body.addressUSDT;
    const userid = req.body.userid;
    const email= req.body.email
    
    Notification.find({ $or: [{ senderaddress: addressBTC }, { recipientaddress: addressBTC },{ senderaddress: addressUSDT }, { recipientaddress: addressUSDT },{initiator:req.body.email},{$and:[{read:'unread'}]}] },function(err,docs){
        if(err){
            res.send({err});
        }
        else if(docs){
            
            res.send(docs)
           
        }
    }).limit(10).sort({'updated': -1})

})

Router.post('/notification/details',middlewareVerify,(req,res)=>{
    Notification.findOne({_id:req.body.userid},function(err,docs){
        if(err){
            res.status(403).send(err)
        }
        else if(docs){
            res.send(docs)
        }
    })
})

Router.post('/test/update', async (req,res)=>{

    let userid = "62509e4a135feac8ad2be9c9";

    let update = await Usermodel.updateMany({_id:userid},{ $set: { Pin_Created: false,email_verification:true } });
    
    if(update){
        res.send({
            'message':'Save'
        })
    }
    else{
        console.log('err')
    }
    
    // const balance = req.body.balance;
    // const id = req.body.userid;
    // console.log(parseFloat(balance).toFixed(8))
    // const update = { balance:parseFloat(balance).toFixed(8) };
//    let x =  Usermodel.findByIdAndUpdate(id,update,{new: true,
//         upsert: true,
//         rawResult: true // Return the raw result from the MongoDB driver
//     });
//     res.json(x)


})

Router.post('/transfer/asset',middlewareVerify,(req,res)=>{
    const userid = req.body.userid;
    const wallets_type = req.body.wallet_type;
    const auto_fee = req.body.auto_fee;
    const amount = req.body.amount;
    const recipentAddress = req.body.recipentaddress;
    const block_average_fee = req.body.block_average
    
    // console.log(recipentAddress);
    // res.json({
    //     recipentAddress
    // })
    // return false;
   let User =  Usermodel.findById({_id:userid},async function(err,docs){
        if(err){
            res.send({
                "message":err.data,
                "status":false
            })
        }
        if(docs){
            
            if(wallets_type === "BTC"){
                // let getBlockFee = await getautofee();
                
                // if(getBlockFee){
                //     res.send({
                //         getBlockFee
                //     })
                // }
                // else{
                //     res.send({
                //         "errror":getBlockFee
                //     })
                // }
                //1 UTXO vin and 2 UTXOs vout = 148+34*2+10(header) = 226 bytes
                //2 UXTO vin and 2 UTXOs vout = 2*148 + 34*2 +10(header) = 374 bytes
                // return false;
                let fee = parseFloat(auto_fee * 226 * 0.00000001 ).toFixed(8);
                let totalAmount  = parseFloat(fee + amount).toFixed(8)
                console.log(totalAmount)
                
                if(docs.btc_wallet[0].balance > totalAmount ){
                    
                   
                    
                    let jupitAddress = await checkJupitAddress(recipentAddress,wallets_type);
                    
                    if(jupitAddress[1]){
                        if(jupitAddress[0]=== "JupitCustomer"){
                            let SubFundToWallet = await SubFund(docs._id,parseFloat(amount).toFixed(8),wallets_type,fee,docs.btc_wallet[0].address,recipentAddress);
                            
                            console.log('SubFundWallet',SubFundToWallet)
                            
                            if(SubFundToWallet){
                                console.log('SubFundWalletII',SubFundToWallet)
                                let AddFundToWallet = await AddFund(recipentAddress,parseFloat(amount).toFixed(8));
                                if(AddFundToWallet){
                                    res.json({
                                        "Message":'Transaction Was Successful',
                                        "Status":true
                                    })
                                }
                                else{
                                    res.json({
                                        "error":'Internal Server Error' + SubFundToWallet,
                                        "Status":false
                                    })
                                }
                            }
                            else{
                                res.json({
                                    "error":'Internal Server Error'+ SubFundToWallet,
                                    "Status":false
                                })
                            }

                            // if(InternalWallet){
                            //     res.json(InternalWallet);
                            // }
                            // else{
                            //     res.json({
                            //         "Error":'Internal Server Error...recipient Address not Found On premises',
                            //         "Status":false
                            //     });
                            // }
                            

                            // if(InternalWallet[1]){
                                
                            // }
                            // else{
                            //     res.json(InternalWallet)
                            // }
                            
                        
                        }
                        else{
                            let UpdateWalletBalances = await updateWalletBalance(docs._id,parseFloat(totalAmount).toFixed(8),wallets_type,fee,docs.btc_wallet[0].address,recipentAddress);
                            if(UpdateWalletBalances){
                                let WalletCallback =  await creditWalletAddress(docs._id,docs.btc_wallet[0].address,recipentAddress,wallets_type,parseFloat(fee).toFixed(8),parseFloat(amount).toFixed(8),block_average_fee)
                                if(WalletCallback[1]){
                                    res.json({
                                        "Message":WalletCallback[0],
                                        "Status":true
                                    })
                                }
                                else{
                                    res.json({
                                        "Message":WalletCallback[0],
                                        "Status":false
                                    })
                                }
                            
                            
                            } 
                            else{
                                res.json({
                                    "error":"InternalServerError...UpdateWallet "+ UpdateWalletBalances,
                                    "status":false,
                                })
                            }

                           
                                
                        }
                    }
                    
                   
                       
                }
                else{
                    res.json({
                        "message":'Insufficent Balance'+docs.btc_wallet[0].balance,

                        "Status":false
                    })
                }
               
                
            }
            if(wallets_type === "USDT"){
                let fee = parseFloat(auto_fee * 0.00000032).toFixed(6);
                let totalAmount  = parseFloat(fee) + parseFloat(amount).toFixed(6);
                if(parseFloat(totalAmount).toFixed(6) > docs.usdt_wallet[0].balance ){
                    let callback = creditWalletAddress(docs._id,docs.usdt_wallet[0].address,recipentAddress,wallets_type,parseFloat(fee).toFixed(6),parseFloat(amount).toFixed(6),block_average_fee)
                    res.send(callback);
                }
                else{
                    res.json({
                        "message":'Insufficent Balance',
                        "Status":false
                    })
                }
                
            }
            
            
        }
        else{
            res.send({
                "message":"Userid not Found",
                "status":false
            })
        }
    })

    
});

Router.post('/update/read',middlewareVerify,(req,res)=>{
    
    let data = false
    req.body.forEach(d=>{
        Notification.findByIdAndUpdate(d,{"read":"read"},function(err,result){
            if(err){
                console.log('MyError',err);
                res.status(403).send(err)

            }
        })
    })

    res.send('Updated');


})

async function creditWalletAddress(userid,address,recipentAddress,wallet_type,auto_fee,amount,block_average_fee){
    
    let isTrue ;
    let secret="44bJugkgbvhzqaMiQ3inE8Hebeka";
    let apikey = "4W1Pg2CeHQMS8hHGr";
    let wallet_id="678693"
   
    

    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function build(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

    // var secret="44bJugkgbvhzqaMiQ3inE8Hebeka";
    var time = Math.floor(new Date().getTime() / 1000);
    var generate_order_id = generateuuID();
   
    // console.log('AutoFee',auto_fee);
    // var newauto_fee = parseInt(auto_fee / 0.00000001);
    
    // console.log('newAuto',newauto_fee)
    // "order_id": "187795_"+generate_order_id,
   
    var params = {
        "requests": [
          {
            "order_id": "187795_"+generate_order_id,
            "address": recipentAddress,
            "amount": amount,
            "memo": address,
            "user_id": userid,
            "message": "message-"+userid,
            "block_average_fee": block_average_fee
            
          },
       
        ],
        "ignore_black_list": false
      }
    

    var CHECKSUM = build(null,secret,time,rand,params);

      
    const parameters = {
        t:time,
        r:rand,
    }
 
    const get_request_args = querystring.stringify(parameters);
   
    const url = `https://demo.thresh0ld.com/v1/sofa/wallets/${wallet_id}/sender/transactions?`+ get_request_args
    
   
   let myAxios = await axios.post(url,params,{
        headers: {
            'Content-Type': 'application/json',
            // 'X-API-CODE':'4W1Pg2CeHQMS8hHGr',
            'X-API-CODE':apikey,
            'X-CHECKSUM':CHECKSUM,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
   })
   .then((result)=>{
    
        return([result.data,true,generate_order_id])
        // let jupitPromise = new Promise(function(resolve,reject){
        //     isTrue = true;
        //     if(isTrue){
        //         resolve()
        //     }
            
        // })
        // jupitPromise.then(()=>{
        //     return 'Completed';
        // }).catch((err)=>{
        //     return 'Uncompleted'
        // })
        
        
   })
   .catch((err)=>{
    console.log(err)
    // return new Promise(function(resolve,reject){
    //     resolve(err.response.data);
    // })
    //    console.log('err',err.response.data)
    // console.log(err.response.data)
    return [err.response.data,false]
    

    // let jupitPromise = new Promise(function(resolve,reject){
    //     isTrue = false;
    //     if(isTrue){
    //         resolve()
    //     }
    //     else{
    //         reject();
    //     }
        
    // })
    // jupitPromise.then(()=>{
    //     return 'Completed';
    // }).catch((err)=>{
    //     return 'Uncompleted'
    // })

    
    
   });
//    console.log('myAxios',myAxios);
   return myAxios;
   
   
   
}


async function creditWalletAddressUSDT(userid,address,recipentAddress,wallet_type,auto_fee,amount,networkFee){
    
    let isTrue ;
   
    let secret="3v1aXdYguESktWRrJVd63ChuhmAu";
    let  apikey="4Jr1WR58zR97LHTUH"
    let wallet_id="201075"
    


    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function build(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

    // var secret="44bJugkgbvhzqaMiQ3inE8Hebeka";
    var time = Math.floor(new Date().getTime() / 1000);
    var generate_order_id = generateuuID();
   
    // console.log('AutoFee',auto_fee);
    // var newauto_fee = parseInt(auto_fee / 0.00000001);
    
    // console.log('newAuto',newauto_fee)
    // "order_id": "187795_"+generate_order_id,
   
    var params = {
        "requests": [
          {
            "order_id": "187795_"+userid,
            "address": recipentAddress,
            "amount": amount,
            "memo": address,
            "user_id": userid,
            "message": "message-"+userid,
            "auto_fee": networkFee
            
          },
       
        ],
        "ignore_black_list": false
      }
    

    var CHECKSUM = build(null,secret,time,rand,params);

      
    const parameters = {
        t:time,
        r:rand,
    }
 
    const get_request_args = querystring.stringify(parameters);
   
    const url = `https://demo.thresh0ld.com/v1/sofa/wallets/${wallet_id}/sender/transactions?`+ get_request_args
    
   
   let myAxios = await axios.post(url,params,{
        headers: {
            'Content-Type': 'application/json',
            // 'X-API-CODE':'4W1Pg2CeHQMS8hHGr',
            'X-API-CODE':apikey,
            'X-CHECKSUM':CHECKSUM,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
   })
   .then((result)=>{
    
        return([result.data,true,generate_order_id])
        // let jupitPromise = new Promise(function(resolve,reject){
        //     isTrue = true;
        //     if(isTrue){
        //         resolve()
        //     }
            
        // })
        // jupitPromise.then(()=>{
        //     return 'Completed';
        // }).catch((err)=>{
        //     return 'Uncompleted'
        // })
        
        
   })
   .catch((err)=>{
    console.log(err)
    // return new Promise(function(resolve,reject){
    //     resolve(err.response.data);
    // })
    //    console.log('err',err.response.data)
    // console.log(err.response.data)
    return [err.response.data,false]
    

    // let jupitPromise = new Promise(function(resolve,reject){
    //     isTrue = false;
    //     if(isTrue){
    //         resolve()
    //     }
    //     else{
    //         reject();
    //     }
        
    // })
    // jupitPromise.then(()=>{
    //     return 'Completed';
    // }).catch((err)=>{
    //     return 'Uncompleted'
    // })

    
    
   });
//    console.log('myAxios',myAxios);
   return myAxios;
   
   
   
}



function generateuuID(){
    return randomUUID(); 
}

async function checkJupitAddress(address,wallet_type){
    const addrr = [];
    let secret="";
    let apikey="";
    if(wallet_type === "BTC"){
        secret="3A84eebqYqeU3HaaXMcEAip8zBRS";
        apikey = "4PiVpdbyLJZatLBwR";
    }
    else if(wallet_type === "USDT"){

    }
    else{
        return ["Invalid Wallet Type",false]
    }
    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function build(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

    var time = Math.floor(new Date().getTime() / 1000);
    var CHECKSUM = build(null,secret,time,rand,null);

      
    const parameters = {
        t:time,
        r:rand,
    }
 
    const get_request_args = querystring.stringify(parameters);
   
    const url = 'https://demo.thresh0ld.com/v1/sofa/wallets/194071/addresses?'+ get_request_args
    
   
   let check = await axios.get(url,{
        headers: {
            'Content-Type': 'application/json',
            'X-API-CODE':apikey,
            'X-CHECKSUM':CHECKSUM,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
   })
   .then((result)=>{
        // console.log(result.data)
        // return([result.data,true])  
        result.data.wallet_address.forEach((d)=>{
            addrr.push(d.address);
        })
        // return ([addrr,true])
        
        if(addrr.includes(address)){
           
            return (['JupitCustomer',true]);
        }
        else{
           
            return (['Non-JupitCustomer',true]);
        }
        
   })
   .catch((err)=>{
    
    return [err.response.data,false]
    
   });

   return check;
  
}

async function CheckAddressValidity (address,walletType){
        let secret = ""
        let Api=""
        let walletId="";

        if(walletType === "BTC"){
            secret = "2awjZJeeVhtG23tepAzv5tcMYYN";
            Api="55JbxSP6xosFTkFvg";
            walletId ="194071"
            
        }
        else if(walletType === "USDT"){
            Api="491Wh19j3Ece4MJRz";
            secret = "2Tzeo889sniN76LerbwjCSshkSZN";
            walletId="488433"
        }

    let rand = random(option_rand);
        var option_rand = {
                min: 48886
                , max: 67889
                , integer: true
            }
    function buildChecksum(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }



    // var secret="3A84eebqYqeU3HaaXMcEAip8zBRS";
    var time = Math.floor(new Date().getTime() / 1000)
    var postData={
        "address":address
    }
    const params = {
        "addresses": [
            address
        ]
    }

    var build = buildChecksum(null,secret,time,rand,params);


        const parameters = {
            t:time,
            r:rand,
        }
        const get_request_args = querystring.stringify(parameters);
        
        const url = `https://demo.thresh0ld.com/v1/sofa/wallets/${walletId}/addresses/verify?`+get_request_args

        
    let x =  await axios.post(url,params,{ 
        headers: {
            'Content-Type': 'application/json',
            'X-API-CODE':Api,
            'X-CHECKSUM':build,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
    })
    .then(res=>{
        console.log('Data',res.data.result[0].valid)
        return[true,res.data.result[0].valid]
       
    })
    .catch((error)=>{
        console.log('Error',error)
        return [false,error.response? error.response.data.message: 'No Connection' ]
    })
    return x;
}


async function AddFund(receipentAddress,amount){


        // let getRequest = await Usermodel.findOneAndUpdate({'btc_wallet.address':receipentAddress},{$set:{'btc_wallet.$.balance':amount}},null,(err)=>{
        //     if(err){
                
        //         return [err,false]
        //     }
        //     else{
        //         return ['Updated Successfully',true]
        //     }
        
        // }).clone().catch(function(err){ return [err,false]});

        let AddFund = await Usermodel.findOneAndUpdate({'btc_wallet.address':receipentAddress},{$inc:{'btc_wallet.$.balance':amount}}).exec();
        
        
        return AddFund
    

}

async function updateWalletBalance(user_id,amount,wallet_type,auto_fee,fromAddress,toAddress){
    // console.log('USER_ID',user_id);
    // console.log('amount',amount);
    // console.log('currency',currency);
    // console.log('auto_fee',auto_fee);
    // console.log('fromAddresss',fromAddress);
    // console.log('toAddress',toAddress);
   
           
    let SubFunds = await Usermodel.findById(user_id, async function(err,docs){
                if(err){
                    return [err,false]
                }
                else if(docs){

                    if(wallet_type === "BTC"){
                        let oldValue = docs.btc_wallet[0].balance;
                        let newValue =   oldValue - amount;
                        let updateValue =  await Usermodel.findByIdAndUpdate(user_id,{$set:{'btc_wallet':{'balance':parseFloat(newValue).toFixed(8),'address':fromAddress}}},function(err,docs){
                            if(err){
                                    return [err,false]
                            }
                            else{
                                return ['updated',true]
                            }
                        }).clone().catch(function(err){ return [err,false]});
                    }
                    else if(wallet_type === "USDT"){
                            let oldValue = docs.usdt_wallet[0].balance;
                            let newValue =   oldValue - amount;
                            let updateValue =  await Usermodel.findByIdAndUpdate(user_id,{$set:{'usdt_wallet':{'balance':parseFloat(newValue).toFixed(8),'address':fromAddress}}},function(err,docs){
                                if(err){
                                        return [err,false]
                                }
                                else{
                                    return ['updated',true]
                                }
                        }).clone().catch(function(err){ return [err,false]});
                    }
                    
                    
                }
            }).clone().catch(function(err){ return [err,false]});
           
           
            if(SubFunds){
               
        
                return['updated',true]
        
            }
            else{
                return['Internal Server Error...UpdateWallet',true]
            }
     
    return transactionSub;
}


Router.post('/update/phonenumber',middlewareVerify,async(req,res)=>{
let userid = req.body.userid;
let phonenumber = req.body.newphonenumber;

let update = await Usermodel.findOneAndUpdate({_id:userid},{'phonenumber':phonenumber}).exec()

if(update){
    res.send('Phonenumber Successfully Updated');
}
else{
    res.status(400).send('Update Error');
}

})



async function SubFund(user_id,amount,wallet_type,auto_fee,fromAddress,toAddress){
    console.log('fromAddress',fromAddress)
    console.log('userid',user_id)
    console.log('amount',amount)
    console.log('auto_fee',auto_fee)
    console.log('to',toAddress)
    console.log('wallet_type',wallet_type)
    if(wallet_type === "BTC"){
        let transactionSub =  await Usermodel.findOne({'btc_wallet.address':toAddress},async function(err,docs){
            if(err){
                
                return [err,false];
            }
            else if(docs){
                
                let SubFunds = await Usermodel.findById(user_id, async function(err,docs){
                    if(err){
                        return [err,false]
                    }
                    else{
                        
                        let oldValue = docs.btc_wallet[0].balance;
                        let newValue =   parseFloat(oldValue) - parseFloat(amount);
                        console.log('oldValue',oldValue);
                        
                        console.log('newValue',newValue);
                       let updateValue =  await Usermodel.findByIdAndUpdate(user_id,{$set:{'btc_wallet':{'balance':parseFloat(newValue).toFixed(8),'address':fromAddress}}},function(err,docs){
                           if(err){
                                return [err,false]
                           }
                           else if(docs){
                            return ['updated',true]
                           }
                           else{
                            return ['Empty',false]
                           }
                       }).clone().catch(function(err){ return [err,false]});
                        
                    }
                }).clone().catch(function(err){ return [err,false]});
               
                //  let SubFunds = await Usermodel.findByIdAndUpdate(user_id, {$inc: { 
                //     btc_wallet: [{ 
                //           balance: parseFloat(amount), 
                           
                //     }] 
                //  }},function(err){
                //     if(err,docs){
                //         console.log(err)
                //     }
                //     else{
                //         console.log(docs)
                //     }
                //  }).clone().catch(function(err){ return [err,false]});
                
                
                let transaction_id = generateuuID();
                if(SubFunds){
                    try{
                        let wallet = wallet_transactions.create({
                            type:'Internal Transfer',
                            serial:user_id,
                            order_id:user_id,
                            currency:wallet_type,
                            txtid:transaction_id,
                            amount:amount,
                            fees:auto_fee,
                            from_address:fromAddress,
                            to_address:toAddress,
                            wallet_id:'MassSender'+user_id,
                            state: "null",
                            confirm_blocks:"null",
                            processing_state:"null",
                            read:"unread",
                            status:'Transaction Completed'
                    
                        })
            
                        return['success',true]
            
                    }
                    catch(err){
                        return [err,false]
                    }
                    
                }
            }
        }).clone().catch(function(err){ return [err,false]});
        
        return transactionSub;
    }
    else if(wallet_type === "USDT"){
        let transactionSub =  await Usermodel.findOne({'usdt_wallet.address':toAddress},async function(err,docs){
            if(err){
                
                return [err,false];
            }
            else if(docs){
                
                let SubFunds = await Usermodel.findById(user_id, async function(err,docs){
                    if(err){
                        return [err,false]
                    }
                    else{
                        
                        let oldValue = docs.usdt_wallet[0].balance;
                        let newValue =   parseFloat(oldValue) - parseFloat(amount);
                        
                       let updateValue =  await Usermodel.findByIdAndUpdate(user_id,{$set:{'usdt_wallet':{'balance':parseFloat(newValue).toFixed(8),'address':fromAddress}}},function(err,docs){
                           if(err){
                                return [err,false]
                           }
                           else if(docs){
                            return ['updated',true]
                           }
                           else{
                            return ['Empty',false]
                           }
                       }).clone().catch(function(err){ return [err,false]});
                        
                    }
                }).clone().catch(function(err){ return [err,false]});
               
                //  let SubFunds = await Usermodel.findByIdAndUpdate(user_id, {$inc: { 
                //     btc_wallet: [{ 
                //           balance: parseFloat(amount), 
                           
                //     }] 
                //  }},function(err){
                //     if(err,docs){
                //         console.log(err)
                //     }
                //     else{
                //         console.log(docs)
                //     }
                //  }).clone().catch(function(err){ return [err,false]});
                
                
                let transaction_id = generateuuID();
                if(SubFunds){
                    try{
                        let wallet = wallet_transactions.create({
                            type:'Internal Transfer',
                            serial:user_id,
                            order_id:user_id,
                            currency:wallet_type,
                            txtid:transaction_id,
                            amount:amount,
                            fees:auto_fee,
                            from_address:fromAddress,
                            to_address:toAddress,
                            wallet_id:'MassSender'+user_id,
                            state: "null",
                            confirm_blocks:"null",
                            processing_state:"null",
                            read:"unread",
                            status:'Transaction Completed'
                    
                        })
            
                        return['success',true]
            
                    }
                    catch(err){
                        return [err,false]
                    }
                    
                }
            }
        }).clone().catch(function(err){ return [err,false]});
        
        return transactionSub;
    }
    
}


function middlewareVerify(req,res,next){
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader === "undefined" || bearerHeader === ""){
       
        res.status(403).send('Token Not Found');
    }
    else{
        req.token = bearerHeader;
        next();
    }
}

//  async function  getautofee(){
    
//     let rand = random(option_rand);
//     var option_rand = {
//             min: 48886
//             , max: 67889
//             , integer: true
//         }
//     function build(params, secret, t, r, postData) {
//         const p = params || [];
//         p.push(`t=${t}`, `r=${r}`);
//         if (!!postData) {
//             if (typeof postData === 'string') {
//                     p.push(postData);
//             } else {
//                     p.push(JSON.stringify(postData));
//             }
//         }
//         p.sort();
//         p.push(`secret=${secret}`);
//         return crypto.createHash('sha256').update(p.join('&')).digest('hex');
//     }

//     var secret="3A84eebqYqeU3HaaXMcEAip8zBRS";
//     var time = Math.floor(new Date().getTime() / 1000)
//     // var postData = [{ "block_num": [1] }]
//     const params = ['{"block_nums":[1,50,100]}'];

//     var CHECKSUM = build(params,secret,time,rand);


//     const parameters = {
//         t:time,
//         r:rand,
//     }
    
//     const get_request_args = querystring.stringify(parameters);
   
//     const url = 'https://demo.thresh0ld.com/v1/sofa/wallets/194071/autofees?'+ get_request_args
    
//     const new_params = {
//         "block_nums": [1,50,100]
//     }
//     let generateAutoFee = await axios.post(url,new_params,{
//         headers: {
//             'Content-Type': 'application/json',
//             'X-API-CODE':'4PiVpdbyLJZatLBwR',
//             'X-CHECKSUM':CHECKSUM,
//             'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
//         }
//    })
//    .then((result)=>{
//        console.log('GetAuto',result.data)
        
//         // res.send({
//         //    "message":result.data,
//         //     "status":true
//         // })
//         return [result.data,true]
        
//    })
  
//    .catch((err)=>{
//     //    console.log(err)
//     //    res.send({
//     //        "message":err,
//     //        "status":false
//     //    })
//     return [err,false]
//    })
//    return generateAutoFee;
// }
async function JupitCustomerCheck(addr,wallet){
    console.log('wallet_type',wallet)
    let result = [];
    if(wallet === "BTC"){
        return  await Usermodel.find({'btc_wallet.address':addr},function(err,docs){
            if(err){
                return [err]
            }
            else if(docs.length > 0){
                return [docs]
            }
            else{
                return [docs];
            }
        }).clone();
    }
    else if(wallet === "USDT"){
        return  await Usermodel.find({'usdt_wallet.address':addr},function(err,docs){
            if(err){
                return [err]
            }
            else if(docs.length > 0){
                return [docs]
            }
            else{
                return [docs];
            }
        }).clone();
    }
    
    
    
}

async function activate_token(){
    

let rand = random(option_rand);
var option_rand = {
        min: 48886
        , max: 67889
        , integer: true
    }

function buildChecksum(params, secret, t, r, postData) {
const p = params || [];
p.push(`t=${t}`, `r=${r}`);
if (!!postData) {
      if (typeof postData === 'string') {
            p.push(postData);
      } else {
            p.push(JSON.stringify(postData));
      }
}
p.sort();
p.push(`secret=${secret}`);
return crypto.createHash('sha256').update(p.join('&')).digest('hex');
}
var secret="2Tzeo889sniN76LerbwjCSshkSZN";
// var rand = "Ademilola2@";
var time = Math.floor(new Date().getTime() / 1000)
var params="";
var postData=""
const parameters = {
  t:time,
  r:rand
}

var build = buildChecksum(null,secret,time,rand,null);

const get_request_args = querystring.stringify(parameters);

const options = {
  hostname: 'demo.thresh0ld.com',
  path: '/v1/sofa/wallets/194071/apisecret/activate?'+ get_request_args,
  method: 'POST',
  headers: {
        'Content-Type': 'application/json',
        'X-API-CODE':'491Wh19j3Ece4MJRz',
        'X-CHECKSUM':build,
        'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
      }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)
  

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.end()
}

async function activateUSDTToken(){
    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
   
    function buildChecksum(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }
    var secret="2Tzeo889sniN76LerbwjCSshkSZN";
    // var rand = "Ademilola2@";
    var time = Math.floor(new Date().getTime() / 1000)
    var params="";
    var postData="";

    var build = buildChecksum(null,secret,time,rand,null);

    const parameters = {
        t:time,
        r:rand,
    }
    const get_request_args = querystring.stringify(parameters);
    
    const url = 'https://demo.thresh0ld.com/v1/sofa/wallets/488433/apisecret/activate?'+get_request_args

    let axiosCallback = await axios.post(url,params,{ 
        headers: {
            'Content-Type': 'application/json',
            'X-API-CODE':'491Wh19j3Ece4MJRz',
            'X-CHECKSUM':build,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
        })
        .then(res=>{
            console.log(res.data)
            return [res.data]
        })
        .catch((error)=>{
        console.log('Error',error.response)
        return [error.response.data]

    })

    return axiosCallback;


}

async function FailedUpdateEmail(addr,txid,subject){
    const mailData = {
        from: 'callback@jupit.app',  // sender address
        to: req.body.email,   // list of receivers
        subject: `${subject}`,
        html: `
                <div style="width:100%;height:100vh;background-color:#f5f5f5; display:flex;justify-content:center;align-item:center">
                    <div style="width:100%; height:70%;background-color:#fff;border-bottom-left-radius:15px;border-bottom-right-radius:15px;">
                        <hr style="width:100%;height:5px;background-color:#1c1c93"/>
                        <div style="width:100%;text-align:center">
                                <img src="https://jupit-asset.s3.us-east-2.amazonaws.com/manual/logo.png" />
                        </div>   
                        <div style="width:100%;text-align:center;margin-top:20px">
                            <h2 style="font-family:candara">Failed Trasaction Impact on ${addr} </h2>
                        <div>   
                        <div style="width:100%;padding-left:20px;text-align:center;padding-top:10px">
                            <hr style="background-color:#f5f5f5;width:95%"/>
                        <div>
                            <div style="width:100%; text-align:center">

                                <p style="font-family:candara;padding:10px;font-size:16px">Dear Team lead,</p>
                                <p style="font-family:candara;font-weight:bold;margin-top:5px;font-size:16px">Kindly Login to your dashboard to reprocess the above wallet address as the balance update on premise failed.</p>
                                <p style="font-family:candara;font-weight:bold;margin-top:5px;font-size:16px">Please Note, the transaction was successfully processed on the blockchain and the fund has been received into our Mass Collection Wallet.</p>
                                <p style="font-family:candara;font-weight:bold;margin-top:5px;font-size:16px;color:#ff0000">Kindly Treat as Urgent!.</p>
                                
                            </div>
                            <div style="width:100%; text-align:center">
                            <p style="font-family:candara;padding:5px"></p>
                            <p style="font-family:candara;padding:5px;color:#1c1c93;font-weight:bold">https:://www.jupit.app</p>
                            </div>
                        </div>
                        </div>

                        <div>
                        <p style="color:#dedede">If you have any questions, please contact support@jupit.app</p>
                        </div>
                    </div>
        
                </div>
            `
      };

    transporter.sendMail(mailData, function (err, info) {
        if(err){
           
            res.send({"message":"An Error Occurred","callback":err})
        }
        
        else{                                   
           // res.send({"message":"Kindly Check Mail for Account Verification Link","callback":info,"status":true})
            
        }
          
     });
}

export default Router;