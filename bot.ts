import { Client } from "discord.js"
import * as _ from "./config.json"
import axios from "axios"
import path from "path"

export default  class PRICEBOT {

  private client: Client[] = []
  private requestIntervalInSeconds: number
  private isConfigRightFormated: boolean

  constructor () {

    this.isConfigRightFormated = this.validateConfig()
    this.requestIntervalInSeconds = _.requestIntervalInSeconds * 1000
    _.discordApiKey.forEach(_ => this.client.push(new Client()))
    
  }

  private fp = (n: number): string => n.toFixed(2)

  private validateConfig = (): boolean => {

    try { 
      return _.currencyIdDecode.length === _.discordApiKey.length   
        && _.coinGeckoApiURL.includes("https")
        && _.currencyList.length > 0
        && typeof _.requestIntervalInSeconds === "number" 
        && (_.requestIntervalInSeconds > 0)
    }
    catch(err) { return false }
  }
  
  private buildEndpointURL = (token: string): string => {

    return _.coinGeckoApiURL
      + "/price?ids="
      + _.currencyIdDecode
      + "&vs_currencies"
      + _.currencyList.join(",")
  }

  private buildDescriptionPrice = (data: any): string => {
    
    if (_.currencyList.length === 1) {
      return `$${this.fp(data[_.currencyList[0]])}` 
    }
    else if (_.currencyList.length >= 2 ) {
      return `$${this.fp(data[_.currencyList[0]])}│` +
        `R$ ${this.fp(data[_.currencyList[1]])}`
    }
    return ""
  }
  private fetchCurrency =(bot: Client, index: number) => {

    const token = _.currencyIdDecode[index]

    axios
      .get(this.buildEndpointURL(token))
      .then((response) => response.data)
      .then(async (data) => {

        if (data[token]) {
         
          bot.user.setActivity({
            name: this.buildDescriptionPrice(data[token]),
            type: "PLAYING",
          })
        }
      })
      .catch(() => console.log("Failed to request endpoint: " + this.buildEndpointURL(token)))
  }
  private setIntervalCurrencyPrice = (bot: Client, index: number) => {
    setInterval(() => 
      this.fetchCurrency(bot, index), 
      this.requestIntervalInSeconds
    )
  }

  public init = () => {
    this.client.map((bot, index) => {

      if (!this.isConfigRightFormated) {
        console.log("Cant validate your config file. Fix it and try again.")
        return false
      }

      bot.login(_.discordApiKey[index])

      bot.on("ready", async () => {
        console.log (_.currencyIdDecode[index] + " is running.")
        bot.user.setAvatar(path.resolve("./assets/" + _.currencyIdDecode[index] + ".png"))
        this.setIntervalCurrencyPrice(bot, index)
      })

    })
  }
 
  public kill = () => {
    this.client.forEach(bot => { bot.destroy() })
  }
}