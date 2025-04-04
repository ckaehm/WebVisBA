import tifffile
#tiff = tifffile.imread('cardiac_0.tif')
tiff = tifffile.imread('11.tif')
#%%
raw_data = tiff.tobytes()
# %%
f = open("mrt.raw", "wb")
f.write(raw_data)
f.close()
# %%
