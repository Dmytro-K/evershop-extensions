const {getConfig} = require("@evershop/evershop/src/lib/util/getConfig");
const {getEnv} = require("@evershop/evershop/src/lib/util/getEnv");
const {select, update} = require("@evershop/postgres-query-builder");
const {pool} = require('@evershop/evershop/src/lib/postgres/connection');
const bucketName = getEnv('AWS_BUCKET_NAME');
const distr_name = getEnv("AWS_CLOUDFRONT_NAME");

const s3_hostname = `${bucketName}.s3.amazonaws.com`;
const cf_hostname = `${distr_name}.cloudfront.net`;

function fix_url(s3_url)
{
    if (!s3_url)
    {
        return s3_url;
    }

    const url = new URL(s3_url);

    if (url.hostname === s3_hostname)
    {
        url.hostname = cf_hostname

        return url.toString();
    }

    return s3_url;
}

module.exports = async function awsSwitchToCloudFront(data) {
    if (getConfig("system.file_storage") === 's3')
    {
        const url_orign = new URL(data.origin_image);

        if (url_orign.hostname.endsWith(".s3.amazonaws.com"))
        {
            const res = await select()
                .from("product_image")
                .where("origin_image", "=", data.origin_image)
                .load(pool);

            if (res)
            {
                if (res.thumb_image)
                {
                    const {origin_image, thumb_image, listing_image, single_image} = res;

                    const origin_image_fixed = fix_url(origin_image);
                    const thumb_image_fixed = fix_url(thumb_image);
                    const listing_image_fixed = fix_url(listing_image);
                    const single_image_fixed = fix_url(single_image);

                    await update('product_image')
                        .given({
                            origin_image: origin_image_fixed,
                            single_image: single_image_fixed,
                            listing_image: listing_image_fixed,
                            thumb_image: thumb_image_fixed
                        })
                        .where('product_image_product_id', '=', data.product_image_product_id)
                        .and('origin_image', '=', data.origin_image)
                        .execute(pool);
                }
            }
        }
    }
}